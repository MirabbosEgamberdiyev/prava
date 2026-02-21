package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.mapper.TopicMapper;
import uz.pravaimtihon.dto.request.TopicRequest;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.dto.response.TopicResponse;
import uz.pravaimtihon.dto.response.TopicSimpleResponse;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.TopicRepository;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.service.MessageService;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * ✅ Service for managing topics with full multi-language support
 * Uses MessageService for localized error messages (like EmailService)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TopicService {

    private final TopicRepository topicRepository;
    private final TopicMapper topicMapper;
    private final MessageService messageService;
    private final FileStorageManager fileStorageManager;

    /**
     * ✅ Create new topic with localized errors
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public TopicResponse createTopic(TopicRequest request, AcceptLanguage language) {
        log.info("Creating new topic with code: {}", request.getCode());

        // Validate code uniqueness
        if (topicRepository.existsByCodeAndDeletedFalse(request.getCode())) {
            String message = messageService.getMessage(
                    "error.topic.code.duplicate",
                    null,
                    language.toLocale()
            );
            throw new BusinessException(message);
        }

        // Validate at least UZL name is provided
        if (request.getNameUzl() == null || request.getNameUzl().isBlank()) {
            String message = messageService.getMessage(
                    "validation.topic.name.uzl.required",
                    new Object[]{request.getCode()},
                    language.toLocale()
            );
            throw new BusinessException(message);
        }
        if (request.hasImage()){
            boolean fileExists = fileStorageManager.fileExists(request.getIconUrl());
            if (fileExists==false){
                throw new BusinessException("error.question.image.not.found");
            }
        }
        Topic topic = Topic.builder()
                .code(request.getCode().toLowerCase().trim())
                .nameUzl(request.getNameUzl())
                .nameUzc(request.getNameUzc())
                .nameEn(request.getNameEn())
                .nameRu(request.getNameRu())
                .descriptionUzl(request.getDescriptionUzl())
                .descriptionUzc(request.getDescriptionUzc())
                .descriptionEn(request.getDescriptionEn())
                .descriptionRu(request.getDescriptionRu())
                .iconUrl(request.getIconUrl())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive())
                .questionCount(0L)
                .build();

        topic = topicRepository.save(topic);

        log.info("Topic created successfully: {} - {}", topic.getId(), topic.getCode());

        return topicMapper.toResponse(topic, language);
    }

    /**
     * ✅ Update existing topic with localized errors
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public TopicResponse updateTopic(Long id, TopicRequest request, AcceptLanguage language) {
        log.info("Updating topic: {}", id);

        Topic topic = topicRepository.findById(id)
                .filter(t -> !t.getDeleted())
                .orElseThrow(() -> {
                    String message = messageService.getMessage(
                            "error.topic.not.found",
                            null,
                            language.toLocale()
                    );
                    return new ResourceNotFoundException(message);
                });

        // Validate code uniqueness (excluding current topic)
        if (!topic.getCode().equals(request.getCode()) &&
                topicRepository.existsByCodeAndIdNotAndDeletedFalse(request.getCode(), id)) {
            String message = messageService.getMessage(
                    "error.topic.code.duplicate",
                    null,
                    language.toLocale()
            );
            throw new BusinessException(message);
        }

        // Validate at least UZL name is provided
        if (request.getNameUzl() == null || request.getNameUzl().isBlank()) {
            String message = messageService.getMessage(
                    "validation.topic.name.uzl.required",
                    new Object[]{request.getCode()},
                    language.toLocale()
            );
            throw new BusinessException(message);
        }
        if (request.hasImage()){
            boolean fileExists = fileStorageManager.fileExists(request.getIconUrl());
            if (fileExists==false){
                throw new BusinessException("error.question.image.not.found");
            }
        }
        topic.setCode(request.getCode().toLowerCase().trim());
        topic.setNameUzl(request.getNameUzl());
        topic.setNameUzc(request.getNameUzc());
        topic.setNameEn(request.getNameEn());
        topic.setNameRu(request.getNameRu());
        topic.setDescriptionUzl(request.getDescriptionUzl());
        topic.setDescriptionUzc(request.getDescriptionUzc());
        topic.setDescriptionEn(request.getDescriptionEn());
        topic.setDescriptionRu(request.getDescriptionRu());
        topic.setIconUrl(request.getIconUrl());
        topic.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        topic.setIsActive(request.getIsActive());

        topic = topicRepository.save(topic);

        log.info("Topic updated successfully: {}", id);

        return topicMapper.toResponse(topic, language);
    }

    /**
     * ✅ Delete topic with localized errors
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public void deleteTopic(Long id) {
        log.info("Deleting topic: {}", id);

        Topic topic = topicRepository.findById(id)
                .filter(t -> !t.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.topic.not.found"));

        // Check if topic has questions
        if (topic.getQuestionCount() != null && topic.getQuestionCount() > 0) {
            throw new BusinessException("error.topic.has.questions");
        }

        String deletedBy = SecurityUtils.getCurrentUser() != null
                ? SecurityUtils.getCurrentUser().getUsername()
                : "system";

        topic.softDelete(deletedBy);
        topicRepository.save(topic);

        log.info("Topic deleted successfully: {}", id);
    }

    /**
     * ✅ Get topic by ID with localized error
     */
    @Transactional(readOnly = true)
    public TopicResponse getTopicById(Long id, AcceptLanguage language) {
        Topic topic = topicRepository.findById(id)
                .filter(t -> !t.getDeleted())
                .orElseThrow(() -> {
                    String message = messageService.getMessage(
                            "error.topic.not.found",
                            null,
                            language.toLocale()
                    );
                    return new ResourceNotFoundException(message);
                });

        return topicMapper.toResponse(topic, language);
    }

    /**
     * ✅ Get topic by code with localized error
     */
    @Transactional(readOnly = true)
    public TopicResponse getTopicByCode(String code, AcceptLanguage language) {
        Topic topic = topicRepository.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> {
                    String message = messageService.getMessage(
                            "error.topic.not.found",
                            null,
                            language.toLocale()
                    );
                    return new ResourceNotFoundException(message);
                });

        return topicMapper.toResponse(topic, language);
    }

    /**
     * ✅ Get all topics with pagination
     */
    @Transactional(readOnly = true)
    public PageResponse<TopicResponse> getAllTopics(Pageable pageable, AcceptLanguage language) {
        Page<Topic> page = topicRepository.findByDeletedFalse(pageable);
        return topicMapper.toPageResponse(page, language);
    }

    /**
     * ✅ Get all active topics (cached)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "topics", key = "#language.code")
    public List<TopicResponse> getAllActiveTopics(AcceptLanguage language) {
        List<Topic> topics = topicRepository.findAllActiveOrderByDisplayOrder();
        return topicMapper.toResponseList(topics, language);
    }

    /**
     * ✅ Get simple topic list for dropdowns (cached)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "topicsSimple", key = "#language.code")
    public List<TopicSimpleResponse> getSimpleTopicList(AcceptLanguage language) {
        List<Topic> topics = topicRepository.findAllActiveOrderByDisplayOrder();
        return topicMapper.toSimpleResponseList(topics, language);
    }

    /**
     * ✅ Get topics with questions only
     */
    @Transactional(readOnly = true)
    public List<TopicSimpleResponse> getTopicsWithQuestions(AcceptLanguage language) {
        List<Topic> topics = topicRepository.findTopicsWithQuestions();
        return topicMapper.toSimpleResponseList(topics, language);
    }

    /**
     * ✅ Search topics
     */
    @Transactional(readOnly = true)
    public PageResponse<TopicResponse> searchTopics(
            String query,
            Pageable pageable,
            AcceptLanguage language
    ) {
        Page<Topic> page = topicRepository.searchTopics(query, pageable);
        return topicMapper.toPageResponse(page, language);
    }

    /**
     * ✅ Toggle topic active status
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public void toggleTopicStatus(Long id) {
        Topic topic = topicRepository.findById(id)
                .filter(t -> !t.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.topic.not.found"));

        topic.setIsActive(!topic.getIsActive());
        topicRepository.save(topic);

        log.info("Topic {} status toggled to: {}", id, topic.getIsActive());
    }

    /**
     * ✅ Get topic entity by ID (for internal use)
     */
    @Transactional(readOnly = true)
    public Topic getTopicEntityById(Long id) {
        return topicRepository.findById(id)
                .filter(t -> !t.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.topic.not.found"));
    }

    /**
     * ✅ Update topic question count
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public void incrementQuestionCount(Long topicId) {
        Topic topic = getTopicEntityById(topicId);
        topic.incrementQuestionCount();
        topicRepository.save(topic);
    }

    /**
     * ✅ Decrement topic question count
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public void decrementQuestionCount(Long topicId) {
        Topic topic = getTopicEntityById(topicId);
        topic.decrementQuestionCount();
        topicRepository.save(topic);
    }

    /**
     * ✅ Create multiple topics at once (Bulk Create) with localized errors
     * Just like EmailService uses MessageService for multi-language support
     */
    @CacheEvict(value = {"topics", "topicsSimple"}, allEntries = true)
    public List<TopicResponse> createBulkTopics(List<TopicRequest> requests, AcceptLanguage language) {
        log.info("Creating {} topics in bulk", requests.size());

        // Validate all codes first
        List<String> codes = requests.stream()
                .map(r -> r.getCode().toLowerCase().trim())
                .toList();

        // Check for duplicate codes in request
        Set<String> uniqueCodes = new HashSet<>(codes);
        if (uniqueCodes.size() != codes.size()) {
            String message = messageService.getMessage(
                    "error.topic.duplicate.codes.in.request",
                    null,
                    language.toLocale()
            );
            throw new BusinessException(message);
        }

        // Check for existing codes in database
        for (String code : codes) {
            if (topicRepository.existsByCodeAndDeletedFalse(code)) {
                String message = messageService.getMessage(
                        "error.topic.code.exists",
                        new Object[]{code},
                        language.toLocale()
                );
                throw new BusinessException(message);
            }
        }

        // Validate all topics have UZL names
        for (TopicRequest request : requests) {
            if (request.getNameUzl() == null || request.getNameUzl().isBlank()) {
                String message = messageService.getMessage(
                        "validation.topic.name.uzl.required",
                        new Object[]{request.getCode()},
                        language.toLocale()
                );
                throw new BusinessException(message);
            }
            if (request.hasImage()){
                boolean fileExists = fileStorageManager.fileExists(request.getIconUrl());
                if (fileExists==false){
                    throw new BusinessException("error.question.image.not.found");
                }
            }
        }

        // Create all topics
        List<Topic> topics = requests.stream()
                .map(request -> Topic.builder()
                        .code(request.getCode().toLowerCase().trim())
                        .nameUzl(request.getNameUzl())
                        .nameUzc(request.getNameUzc())
                        .nameEn(request.getNameEn())
                        .nameRu(request.getNameRu())
                        .descriptionUzl(request.getDescriptionUzl())
                        .descriptionUzc(request.getDescriptionUzc())
                        .descriptionEn(request.getDescriptionEn())
                        .descriptionRu(request.getDescriptionRu())
                        .iconUrl(request.getIconUrl())
                        .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                        .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                        .questionCount(0L)
                        .build())
                .toList();

        // Save all at once (batch operation)
        List<Topic> savedTopics = topicRepository.saveAll(topics);

        log.info("Successfully created {} topics in bulk", savedTopics.size());

        return topicMapper.toResponseList(savedTopics, language);
    }
}