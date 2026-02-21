package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.request.PackageRequest;
import uz.pravaimtihon.dto.request.PackagePatchRequest;
import uz.pravaimtihon.dto.response.PackageDetailResponse;
import uz.pravaimtihon.dto.response.PackageResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.PackageGenerationType;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.repository.ExamSessionRepository;
import uz.pravaimtihon.dto.mapper.PackageMapper;
import uz.pravaimtihon.service.MessageService;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

/**
 * Package Service - Manages exam packages.
 *
 * Delegates to:
 * - QuestionSelectionService: Question selection and distribution
 * - PackageValidationService: Validation logic
 *
 * @author Prava Online Development Team
 * @version 3.0 (Refactored)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PackageService {

    private final ExamPackageRepository packageRepository;
    private final ExamSessionRepository examSessionRepository;
    private final TopicService topicService;
    private final PackageMapper packageMapper;
    private final MessageService messageService;

    // Delegated services
    private final QuestionSelectionService questionSelectionService;
    private final PackageValidationService packageValidationService;

    // ============================================
    // CREATE OPERATIONS
    // ============================================

    /**
     * Create new exam package with intelligent question distribution.
     */
    @CacheEvict(value = "packages", allEntries = true)
    public PackageResponse createPackage(PackageRequest request, AcceptLanguage language) {
        log.info("📦 Creating package: {} (Type: {}, Count: {}, Language: {})",
                request.getNameUzl(),
                request.getGenerationType(),
                request.getQuestionCount(),
                language.getCode());

        // 1. Validate package name uniqueness across ALL 4 languages
        packageValidationService.validateUniquePackageNameAllLanguages(request, null, language);

        // 2. Validate price for paid packages
        packageValidationService.validatePackagePrice(request, language);

        // 3. Get topic for AUTO_TOPIC generation
        Topic topic = packageValidationService.resolveTopicForPackage(request, language);

        // 4. Create package entity with all language fields
        ExamPackage pkg = buildPackageEntity(request, topic);
        pkg = packageRepository.save(pkg);
        log.info("✅ Package entity created with ID: {}", pkg.getId());

        // 5. Select questions with intelligent distribution
        Set<Question> selectedQuestions = questionSelectionService
                .selectQuestionsWithIntelligentDistribution(pkg, request, language);

        // 6. Assign questions and save
        pkg.setQuestions(selectedQuestions);
        pkg = packageRepository.save(pkg);

        // 7. Log overlap statistics for monitoring
        questionSelectionService.logQuestionOverlapStatistics(pkg.getId(), selectedQuestions, language);

        log.info("🎉 Package created successfully: ID={}, Questions={}, Language={}",
                pkg.getId(), pkg.getQuestions().size(), language.getCode());

        return packageMapper.toResponse(pkg, language);
    }

    /**
     * Update package (FULL update - PUT).
     */
    @CacheEvict(value = "packages", allEntries = true)
    public PackageResponse updatePackage(Long id, PackageRequest request, AcceptLanguage language) {
        log.info("📝 FULL update package: {} (Language: {})", id, language.getCode());

        ExamPackage pkg = findPackageOrThrow(id, language);

        // Active exam protection
        packageValidationService.validateNoActiveExams(
                examSessionRepository.existsActiveSessionsByPackageId(id), language);

        // 1. Validate names across all languages
        packageValidationService.validateUniquePackageNameAllLanguages(request, id, language);

        // 2. Validate pricing rules
        packageValidationService.validatePackagePrice(request, language);

        // 3. Resolve topic if AUTO_TOPIC
        Topic topic = packageValidationService.resolveTopicForPackage(request, language);
        pkg.setTopic(topic);

        // 4. Update ALL metadata fields
        updatePackageFields(pkg, request);

        // 5. Rebuild questions (PUT → always rebuild)
        pkg.getQuestions().clear();
        Set<Question> questions = questionSelectionService
                .selectQuestionsWithIntelligentDistribution(pkg, request, language);

        pkg.setQuestions(questions);
        pkg.setQuestionCount(questions.size());
        pkg = packageRepository.save(pkg);

        log.info("✅ Package fully updated: ID={}, Questions={}", pkg.getId(), pkg.getQuestions().size());
        return packageMapper.toResponse(pkg, language);
    }

    /**
     * Patch package (PARTIAL update - PATCH).
     */
    @CacheEvict(value = "packages", allEntries = true)
    public PackageResponse patchPackage(Long id, PackagePatchRequest request, AcceptLanguage language) {
        log.info("🔧 PATCH package: {} (Language: {})", id, language.getCode());

        ExamPackage pkg = findPackageOrThrow(id, language);
        boolean regenerateQuestions = false;

        // NAME VALIDATION
        if (hasAnyNameUpdate(request)) {
            packageValidationService.validateUniquePackageNameAllLanguages(
                    buildNameValidationRequest(request, pkg), id, language);
        }

        // METADATA PATCH
        applyMetadataPatch(pkg, request);

        // PRICE / FREE LOGIC
        applyPricePatch(pkg, request, language);

        // QUESTION COUNT (AUTO)
        if (request.getQuestionCount() != null &&
                !request.getQuestionCount().equals(pkg.getQuestionCount())) {

            packageValidationService.validateNotManualForQuestionCountChange(
                    pkg.getGenerationType(), language);

            pkg.setQuestionCount(request.getQuestionCount());
            regenerateQuestions = true;
        }

        // QUESTION IDS (MANUAL)
        if (request.getQuestionIds() != null) {
            packageValidationService.validateManualOnlyForQuestionIds(
                    pkg.getGenerationType(), language);

            PackageRequest manualRequest = PackageRequest.builder()
                    .generationType(PackageGenerationType.MANUAL)
                    .questionIds(request.getQuestionIds())
                    .build();

            Set<Question> questions = questionSelectionService.selectManualQuestions(manualRequest, language);
            pkg.getQuestions().clear();
            pkg.getQuestions().addAll(questions);
            pkg.setQuestionCount(questions.size());
        }

        // AUTO REGENERATION
        if (regenerateQuestions && pkg.getGenerationType() != PackageGenerationType.MANUAL) {
            PackageRequest regenRequest = PackageRequest.builder()
                    .questionCount(pkg.getQuestionCount())
                    .generationType(pkg.getGenerationType())
                    .topicId(pkg.getTopicId())
                    .build();

            pkg.getQuestions().clear();
            pkg.getQuestions().addAll(
                    questionSelectionService.selectQuestionsWithIntelligentDistribution(pkg, regenRequest, language));
        }

        pkg = packageRepository.save(pkg);
        log.info("✅ Package patched: ID={}, Questions={}", pkg.getId(), pkg.getQuestions().size());
        return packageMapper.toResponse(pkg, language);
    }

    /**
     * Regenerate package questions.
     */
    @CacheEvict(value = "packages", allEntries = true)
    public PackageResponse regeneratePackageQuestions(Long id, AcceptLanguage language) {
        log.info("🔄 Regenerating questions for package: {} (Language: {})", id, language.getCode());

        ExamPackage pkg = findPackageOrThrow(id, language);

        // Validations
        packageValidationService.validateCanRegenerate(pkg.getGenerationType(), language);
        packageValidationService.validateNoActiveExams(
                examSessionRepository.existsActiveSessionsByPackageId(id), language);

        // Create version snapshot before regenerating
        createPackageSnapshot(pkg, language);

        // Clear existing questions
        Set<Question> oldQuestions = new HashSet<>(pkg.getQuestions());
        pkg.getQuestions().clear();

        // Generate new questions
        PackageRequest request = PackageRequest.builder()
                .questionCount(pkg.getQuestionCount())
                .generationType(pkg.getGenerationType())
                .topicId(pkg.getTopicId())
                .build();

        Set<Question> newQuestions = questionSelectionService
                .selectQuestionsWithIntelligentDistribution(pkg, request, language);
        pkg.setQuestions(newQuestions);
        pkg = packageRepository.save(pkg);

        // Log change statistics
        questionSelectionService.logRegenerationStatistics(oldQuestions, newQuestions, language);

        log.info("✅ Questions regenerated: Package={}, NewCount={}", id, newQuestions.size());
        return packageMapper.toResponse(pkg, language);
    }

    // ============================================
    // READ OPERATIONS
    // ============================================

    @Transactional(readOnly = true)
    public PageResponse<PackageResponse> getAllPackages(Pageable pageable, AcceptLanguage language) {
        log.debug("📖 Getting all active packages (Language: {})", language.getCode());
        Page<ExamPackage> page = packageRepository.findByDeletedFalseAndIsActiveTrue(pageable);
        return packageMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    public PageResponse<PackageResponse> getAllPackagesAdmin(Pageable pageable, AcceptLanguage language) {
        log.debug("📖 Getting all packages for admin (Language: {})", language.getCode());
        Page<ExamPackage> page = packageRepository.findByDeletedFalse(pageable);
        return packageMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    public PageResponse<PackageResponse> getFreePackages(Pageable pageable, AcceptLanguage language) {
        log.debug("📖 Getting free packages (Language: {})", language.getCode());
        Page<ExamPackage> page = packageRepository.findByIsFreeAndDeletedFalseAndIsActiveTrue(true, pageable);
        return packageMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    public PackageResponse getPackageById(Long id, AcceptLanguage language) {
        log.debug("📖 Getting package: {} (Language: {})", id, language.getCode());
        ExamPackage pkg = findPackageOrThrow(id, language);
        return packageMapper.toResponse(pkg, language);
    }

    @Transactional(readOnly = true)
    public PackageDetailResponse getPackageDetail(Long id, AcceptLanguage language) {
        log.debug("📖 Getting package detail: {} (Language: {})", id, language.getCode());
        ExamPackage pkg = packageRepository.findByIdWithQuestionsAndOptions(id);
        if (pkg == null) {
            throw new ResourceNotFoundException(
                    messageService.getMessage("error.package.not.found", language));
        }
        return packageMapper.toDetailResponse(pkg, language);
    }

    @Transactional(readOnly = true)
    public PageResponse<PackageResponse> getPackagesByTopic(String topicCode, Pageable pageable, AcceptLanguage language) {
        log.debug("📖 Getting packages by topic: {} (Language: {})", topicCode, language.getCode());
        Topic topic = topicService.getTopicEntityById(
                topicService.getTopicByCode(topicCode, language).getId());
        Page<ExamPackage> page = packageRepository.findByTopicAndDeletedFalseAndIsActiveTrue(topic, pageable);
        return packageMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    public long getPackageCount() {
        return packageRepository.countActivePackages();
    }

    // ============================================
    // DELETE & TOGGLE OPERATIONS
    // ============================================

    @CacheEvict(value = "packages", allEntries = true)
    public void deletePackage(Long id) {
        log.info("🗑️ Deleting package: {}", id);

        ExamPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("error.package.not.found"));

        if (examSessionRepository.existsActiveSessionsByPackageId(id)) {
            throw new BusinessException("error.package.has.active.exams");
        }

        pkg.softDelete("SYSTEM");
        packageRepository.save(pkg);
        log.info("✅ Package deleted: {}", id);
    }

    @CacheEvict(value = "packages", allEntries = true)
    public void togglePackageStatus(Long id) {
        log.info("🔄 Toggling package status: {}", id);

        ExamPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("error.package.not.found"));

        pkg.setIsActive(!pkg.getIsActive());
        packageRepository.save(pkg);
        log.info("✅ Package {} status toggled to: {}", id, pkg.getIsActive());
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private ExamPackage findPackageOrThrow(Long id, AcceptLanguage language) {
        return packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageService.getMessage("error.package.not.found", language)));
    }

    private boolean hasAnyNameUpdate(PackagePatchRequest request) {
        return request.getNameUzl() != null ||
                request.getNameUzc() != null ||
                request.getNameEn() != null ||
                request.getNameRu() != null;
    }

    private PackageRequest buildNameValidationRequest(PackagePatchRequest request, ExamPackage pkg) {
        return PackageRequest.builder()
                .nameUzl(Optional.ofNullable(request.getNameUzl()).orElse(pkg.getNameUzl()))
                .nameUzc(Optional.ofNullable(request.getNameUzc()).orElse(pkg.getNameUzc()))
                .nameEn(Optional.ofNullable(request.getNameEn()).orElse(pkg.getNameEn()))
                .nameRu(Optional.ofNullable(request.getNameRu()).orElse(pkg.getNameRu()))
                .build();
    }

    private void applyMetadataPatch(ExamPackage pkg, PackagePatchRequest request) {
        if (request.getNameUzl() != null) pkg.setNameUzl(request.getNameUzl());
        if (request.getNameUzc() != null) pkg.setNameUzc(request.getNameUzc());
        if (request.getNameEn() != null) pkg.setNameEn(request.getNameEn());
        if (request.getNameRu() != null) pkg.setNameRu(request.getNameRu());

        if (request.getDescriptionUzl() != null) pkg.setDescriptionUzl(request.getDescriptionUzl());
        if (request.getDescriptionUzc() != null) pkg.setDescriptionUzc(request.getDescriptionUzc());
        if (request.getDescriptionEn() != null) pkg.setDescriptionEn(request.getDescriptionEn());
        if (request.getDescriptionRu() != null) pkg.setDescriptionRu(request.getDescriptionRu());

        if (request.getDurationMinutes() != null) pkg.setDurationMinutes(request.getDurationMinutes());
        if (request.getPassingScore() != null) pkg.setPassingScore(request.getPassingScore());
        if (request.getOrderIndex() != null) pkg.setOrderIndex(request.getOrderIndex());
        if (request.getIsActive() != null) pkg.setIsActive(request.getIsActive());
    }

    private void applyPricePatch(ExamPackage pkg, PackagePatchRequest request, AcceptLanguage language) {
        if (request.getIsFree() != null) {
            pkg.setIsFree(request.getIsFree());
            if (!pkg.getIsFree() && pkg.getPrice() == null) {
                throw new BusinessException(
                        messageService.getMessage("error.package.price.required", language));
            }
        }

        if (request.getPrice() != null) {
            if (!pkg.getIsFree() && request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(
                        messageService.getMessage("error.package.price.invalid", language));
            }
            pkg.setPrice(request.getPrice());
        }
    }

    private ExamPackage buildPackageEntity(PackageRequest request, Topic topic) {
        return ExamPackage.builder()
                .nameUzl(request.getNameUzl())
                .nameUzc(request.getNameUzc())
                .nameEn(request.getNameEn())
                .nameRu(request.getNameRu())
                .descriptionUzl(request.getDescriptionUzl())
                .descriptionUzc(request.getDescriptionUzc())
                .descriptionEn(request.getDescriptionEn())
                .descriptionRu(request.getDescriptionRu())
                .questionCount(request.getQuestionCount())
                .durationMinutes(request.getDurationMinutes())
                .passingScore(request.getPassingScore())
                .generationType(request.getGenerationType())
                .topic(topic)
                .isFree(request.getIsFree())
                .price(request.getPrice())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .isActive(request.getIsActive())
                .questions(new HashSet<>())
                .build();
    }

    private void updatePackageFields(ExamPackage pkg, PackageRequest request) {
        pkg.setNameUzl(request.getNameUzl());
        pkg.setNameUzc(request.getNameUzc());
        pkg.setNameEn(request.getNameEn());
        pkg.setNameRu(request.getNameRu());
        pkg.setDescriptionUzl(request.getDescriptionUzl());
        pkg.setDescriptionUzc(request.getDescriptionUzc());
        pkg.setDescriptionEn(request.getDescriptionEn());
        pkg.setDescriptionRu(request.getDescriptionRu());
        pkg.setQuestionCount(request.getQuestionCount());
        pkg.setDurationMinutes(request.getDurationMinutes());
        pkg.setPassingScore(request.getPassingScore());
        pkg.setIsFree(request.getIsFree());
        pkg.setPrice(request.getPrice());
        pkg.setOrderIndex(request.getOrderIndex());
        pkg.setIsActive(request.getIsActive());
    }

    private void createPackageSnapshot(ExamPackage pkg, AcceptLanguage language) {
        log.info("📸 Creating snapshot for package {} before regeneration (Language: {})",
                pkg.getId(), language.getCode());
    }
}
