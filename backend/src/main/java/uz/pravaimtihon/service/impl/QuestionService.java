package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.mapper.QuestionMapper;
import uz.pravaimtihon.dto.request.BulkQuestionRequest;
import uz.pravaimtihon.dto.request.QuestionOptionRequest;
import uz.pravaimtihon.dto.request.QuestionRequest;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.QuestionOption;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.QuestionDifficulty;
import uz.pravaimtihon.exception.BaseException;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.QuestionOptionRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TopicRepository;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.service.MessageService;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final TopicRepository topicRepository;
    private final QuestionMapper questionMapper;
    private final TopicService topicService;
    private final MessageService messageService;
    private final FileStorageManager fileStorageManager;


    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public QuestionResponse createQuestion(QuestionRequest request, AcceptLanguage language) {
        log.info("Creating question for topic ID: {}", request.getTopicId());

        validateQuestionRequest(request);

        Topic topic = request.getTopicId() != null
                ? topicService.getTopicEntityById(request.getTopicId())
                : null;

        if (request.getTextUzl() != null && topic != null &&
                questionRepository.existsByTextUzlAndTopicAndDeletedFalse(request.getTextUzl(), topic)) {
            throw new BusinessException("error.question.duplicate");
        }

        Question question = Question.builder()
                .textUzl(request.getTextUzl())
                .textUzc(request.getTextUzc())
                .textEn(request.getTextEn())
                .textRu(request.getTextRu())
                .explanationUzl(request.getExplanationUzl())
                .explanationUzc(request.getExplanationUzc())
                .explanationEn(request.getExplanationEn())
                .explanationRu(request.getExplanationRu())
                .topic(topic)
                .difficulty(request.getDifficulty())
                .correctAnswerIndex(request.getCorrectAnswerIndex())
                .imageUrl(request.getImageUrl())
                .isActive(request.getIsActive())
                .build();

        question = questionRepository.save(question);

        // Create options with proper relationship
        List<QuestionOption> options = new ArrayList<>();
        if (request.getOptions() != null) {
            for (QuestionOptionRequest optReq : request.getOptions()) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .optionIndex(optReq.getOptionIndex())
                        .textUzl(optReq.getTextUzl())
                        .textUzc(optReq.getTextUzc())
                        .textEn(optReq.getTextEn())
                        .textRu(optReq.getTextRu())
                        .build();
                options.add(option);
            }
        }

        if (!options.isEmpty()) {
            optionRepository.saveAll(options);
        }
        question.setOptions(options);

        if (topic != null) {
            topicService.incrementQuestionCount(topic.getId());
        }

        log.info("Question created: {} for topic: {}", question.getId(), topic != null ? topic.getCode() : "none");

        return questionMapper.toResponse(question, language);
    }

    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public QuestionResponse updateQuestion(Long id, QuestionRequest request, AcceptLanguage language) {
        log.info("Updating question: {}", id);

        validateQuestionRequest(request);

        Question question = questionRepository.findByIdWithOptions(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        Topic newTopic = request.getTopicId() != null
                ? topicService.getTopicEntityById(request.getTopicId())
                : question.getTopic();
        Topic oldTopic = question.getTopic();

        if (request.getTextUzl() != null && newTopic != null &&
                questionRepository.existsByTextUzlAndTopicAndIdNotAndDeletedFalse(
                        request.getTextUzl(), newTopic, id)) {
            throw new BusinessException("error.question.duplicate");
        }

        question.setTextUzl(request.getTextUzl());
        question.setTextUzc(request.getTextUzc());
        question.setTextEn(request.getTextEn());
        question.setTextRu(request.getTextRu());
        question.setExplanationUzl(request.getExplanationUzl());
        question.setExplanationUzc(request.getExplanationUzc());
        question.setExplanationEn(request.getExplanationEn());
        question.setExplanationRu(request.getExplanationRu());
        question.setDifficulty(request.getDifficulty());
        question.setCorrectAnswerIndex(request.getCorrectAnswerIndex());
        question.setImageUrl(request.getImageUrl());
        question.setIsActive(request.getIsActive());

        if (newTopic != null && oldTopic != null && !oldTopic.getId().equals(newTopic.getId())) {
            question.setTopic(newTopic);
            topicService.decrementQuestionCount(oldTopic.getId());
            topicService.incrementQuestionCount(newTopic.getId());
        }

        // ✅ options yangilash — reference o'zgarmaydi
        List<QuestionOption> currentOptions = question.getOptions();
        if (currentOptions == null) {
            currentOptions = new ArrayList<>();
            question.setOptions(currentOptions);
        }

        if (!currentOptions.isEmpty()) {
            optionRepository.deleteAll(currentOptions);
            currentOptions.clear();
        }

        if (request.getOptions() != null) {
            for (QuestionOptionRequest optReq : request.getOptions()) {
                QuestionOption option = QuestionOption.builder()
                        .question(question)
                        .optionIndex(optReq.getOptionIndex())
                        .textUzl(optReq.getTextUzl())
                        .textUzc(optReq.getTextUzc())
                        .textEn(optReq.getTextEn())
                        .textRu(optReq.getTextRu())
                        .build();
                currentOptions.add(option);
            }
            optionRepository.saveAll(currentOptions);
        }

        questionRepository.save(question);

        log.info("Question updated: {}", id);
        return questionMapper.toResponse(question, language);
    }

//    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
//    public void deleteQuestion(Long id) {
//        log.info("Deleting question: {}", id);
//
//        Question question = questionRepository.findById(id)
//                .filter(q -> !q.getDeleted())
//                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));
//
//        String deletedBy = SecurityUtils.getCurrentUser() != null
//                ? SecurityUtils.getCurrentUser().getUsername()
//                : "system";
//
//        question.softDelete(deletedBy);
//        questionRepository.save(question);
//
//        topicService.decrementQuestionCount(question.getTopic().getId());
//
//        log.info("Question deleted: {}", id);
//    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(Long id, AcceptLanguage language) {
        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        return questionMapper.toResponse(question, language);
    }

    /**
     * Admin edit uchun savol detail - barcha 4 til varianti qaytariladi.
     */
    @Transactional(readOnly = true)
    public QuestionDetailResponse getQuestionDetail(Long id) {
        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        return questionMapper.toDetailResponse(question);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "questions", key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #language.code")
    public PageResponse<QuestionResponse> getAllQuestions(Pageable pageable, AcceptLanguage language) {
        Page<Question> page = questionRepository.findByDeletedFalseAndIsActiveTrue(pageable);
        return questionMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "questionsByTopic", key = "#topicId + '-' + #pageable.pageNumber + '-' + #pageable.pageSize + '-' + #language.code")
    public PageResponse<QuestionResponse> getQuestionsByTopicId(Long topicId, Pageable pageable, AcceptLanguage language) {
        Page<Question> page = questionRepository.findByTopicIdAndDeletedFalseAndIsActiveTrue(topicId, pageable);
        return questionMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuestionResponse> searchQuestions(String query, Pageable pageable, AcceptLanguage language) {
        Page<Question> page = questionRepository.searchQuestions(query, pageable);
        return questionMapper.toPageResponse(page, language);
    }

    /**
     * ✅ FINAL FIX: Bulk import with proper i18n error messages
     * Muammo: Exception catch qilinganda locale context bilan ishlash
     */
    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public BulkQuestionResponse bulkImportQuestions(BulkQuestionRequest request, AcceptLanguage language) {
        List<QuestionResponse> successList = new ArrayList<>();
        List<String> errorList = new ArrayList<>();

        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            return new BulkQuestionResponse(0, 0, 0, successList, errorList);
        }

        log.info("Bulk importing {} questions with language: {}", request.getQuestions().size(), language);

        // ✅ KEY FIX: Locale ni method boshida olish va saqlash
        Locale targetLocale = language.toLocale();
        log.debug("Target locale for errors: {}", targetLocale);

        for (int i = 0; i < request.getQuestions().size(); i++) {
            try {
                QuestionRequest qr = request.getQuestions().get(i);
                validateQuestionRequest(qr);
                QuestionResponse response = createQuestion(qr, language);
                successList.add(response);

            } catch (BusinessException e) {
                // ✅ BusinessException - messageKey orqali tarjima qilish
                String messageKey = e.getMessageKey();
                Object[] args = e.getArgs();

                String translatedMessage;
                if (messageKey != null) {
                    // MessageKey mavjud - to'g'ridan-to'g'ri messageService orqali tarjima
                    translatedMessage = messageService.getMessage(messageKey, args, targetLocale);
                    log.debug("Translated '{}' to: '{}'", messageKey, translatedMessage);
                } else {
                    // MessageKey yo'q - getMessage() dan tekshirish
                    String rawMessage = e.getMessage();
                    if (rawMessage != null &&
                            (rawMessage.startsWith("validation.") || rawMessage.startsWith("error."))) {
                        translatedMessage = messageService.getMessage(rawMessage, args, targetLocale);
                    } else {
                        translatedMessage = rawMessage;
                    }
                }

                String error = String.format("Question #%d: %s", i + 1, translatedMessage);
                errorList.add(error);
                log.error("Error importing question #{}: {}", i + 1, translatedMessage);

            } catch (ResourceNotFoundException e) {
                // ✅ ResourceNotFoundException
                String messageKey = e.getMessageKey();
                Object[] args = e.getArgs();

                String translatedMessage;
                if (messageKey != null) {
                    translatedMessage = messageService.getMessage(messageKey, args, targetLocale);
                } else {
                    String rawMessage = e.getMessage();
                    if (rawMessage != null &&
                            (rawMessage.startsWith("validation.") || rawMessage.startsWith("error."))) {
                        translatedMessage = messageService.getMessage(rawMessage, args, targetLocale);
                    } else {
                        translatedMessage = rawMessage;
                    }
                }

                String error = String.format("Question #%d: %s", i + 1, translatedMessage);
                errorList.add(error);
                log.error("Error importing question #{}: {}", i + 1, translatedMessage);

            } catch (BaseException e) {
                // ✅ Boshqa BaseException subclass'lari
                String messageKey = e.getMessageKey();
                Object[] args = e.getArgs();

                String translatedMessage;
                if (messageKey != null) {
                    translatedMessage = messageService.getMessage(messageKey, args, targetLocale);
                } else {
                    String rawMessage = e.getMessage();
                    if (rawMessage != null &&
                            (rawMessage.startsWith("validation.") || rawMessage.startsWith("error."))) {
                        translatedMessage = messageService.getMessage(rawMessage, args, targetLocale);
                    } else {
                        translatedMessage = rawMessage;
                    }
                }

                String error = String.format("Question #%d: %s", i + 1, translatedMessage);
                errorList.add(error);
                log.error("Error importing question #{}: {}", i + 1, translatedMessage);

            } catch (Exception e) {
                // ✅ Umuman boshqa exception'lar
                String error = String.format("Question #%d: %s - %s",
                        i + 1,
                        e.getClass().getSimpleName(),
                        e.getMessage()
                );
                errorList.add(error);
                log.error("Unexpected error importing question #{}: {}", i + 1, e.getMessage(), e);
            }
        }

        log.info("Bulk import completed: {} success, {} failed", successList.size(), errorList.size());

        return new BulkQuestionResponse(
                request.getQuestions().size(),
                successList.size(),
                errorList.size(),
                successList,
                errorList
        );
    }
    @Transactional(readOnly = true)
    public List<QuestionResponse> getRandomQuestions(Long topicId, Integer count, AcceptLanguage language) {
        Pageable pageable = Pageable.ofSize(count);
        List<Question> questions;

        if (topicId != null) {
            questions = questionRepository.findRandomByTopicId(topicId, pageable);
        } else {
            questions = questionRepository.findRandomQuestions(pageable);
        }

        return questionMapper.toResponseList(questions, language);
    }

    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public void toggleQuestionStatus(Long id) {
        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        question.setIsActive(!question.getIsActive());
        questionRepository.save(question);

        log.info("Question {} status toggled to: {}", id, question.getIsActive());
    }

    @Transactional(readOnly = true)
    public long getQuestionCountByTopicId(Long topicId) {
        return questionRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topicId);
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestionsWithLowSuccessRate(double threshold, int limit, AcceptLanguage language) {
        List<Question> questions = questionRepository.findQuestionsWithLowSuccessRate(threshold, Pageable.ofSize(limit));
        return questionMapper.toResponseList(questions, language);
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getMostUsedQuestions(int limit, AcceptLanguage language) {
        List<Question> questions = questionRepository.findMostUsedQuestions(Pageable.ofSize(limit));
        return questionMapper.toResponseList(questions, language);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "activeQuestions", key = "#language.code")
    public List<QuestionResponse> getAllActiveQuestions(AcceptLanguage language) {
        List<Question> questions = questionRepository.findByDeletedFalseAndIsActiveTrue(Pageable.unpaged()).getContent();
        return questionMapper.toResponseList(questions, language);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuestionResponse> getQuestionsByDifficulty(String difficulty, Pageable pageable, AcceptLanguage language) {
        QuestionDifficulty diff = QuestionDifficulty.valueOf(difficulty.toUpperCase());
        Page<Question> page = questionRepository.findByDifficultyAndDeletedFalseAndIsActiveTrue(diff, pageable);
        return questionMapper.toPageResponse(page, language);
    }

    @Transactional(readOnly = true)
    public List<TopicQuestionStatResponse> getQuestionStatsByAllTopics(AcceptLanguage language) {
        List<String> topicCodes = questionRepository.findAllDistinctTopicCodes();

        return topicCodes.stream().map(code -> {
                    Topic topic = topicRepository.findByCodeAndDeletedFalse(code)
                            .orElse(null);

                    if (topic == null) return null;

                    long total = questionRepository.countByTopicCode(code);
                    long active = questionRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topic.getId());

                    long easy = questionRepository.countByTopicAndDifficultyAndDeletedFalseAndIsActiveTrue(topic, QuestionDifficulty.EASY);
                    long medium = questionRepository.countByTopicAndDifficultyAndDeletedFalseAndIsActiveTrue(topic, QuestionDifficulty.MEDIUM);
                    long hard = questionRepository.countByTopicAndDifficultyAndDeletedFalseAndIsActiveTrue(topic, QuestionDifficulty.HARD);

                    Double avgSuccessRate = questionRepository.findAverageSuccessRateByTopicId(topic.getId());

                    return TopicQuestionStatResponse.builder()
                            .topicId(topic.getId())
                            .topicCode(topic.getCode())
                            .topicName(topic.getName(language))
                            .totalQuestions(total)
                            .activeQuestions(active)
                            .easyQuestions(easy)
                            .mediumQuestions(medium)
                            .hardQuestions(hard)
                            .averageSuccessRate(avgSuccessRate != null ? avgSuccessRate : 0.0)
                            .build();
                })
                .filter(stat -> stat != null)
                .collect(Collectors.toList());
    }

    private void validateQuestionRequest(QuestionRequest request) {
        // correctAnswerIndex va options mavjud bo'lsa tekshirish
        if (request.getCorrectAnswerIndex() != null && request.getOptions() != null && !request.getOptions().isEmpty()) {
            if (request.getCorrectAnswerIndex() < 0 || request.getCorrectAnswerIndex() >= request.getOptions().size()) {
                throw new BusinessException("validation.question.correctAnswer.invalid");
            }
        }

        // optionIndex ni avtomatik to'g'rilash (frontend har doim to'g'ri tartibda bermasa ham ishlaydi)
        if (request.getOptions() != null) {
            for (int i = 0; i < request.getOptions().size(); i++) {
                request.getOptions().get(i).setOptionIndex(i);
            }
        }
    }


    /**
     * Create question with optional image upload
     */
    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public QuestionResponse createQuestionWithImage(
            QuestionRequest request,
            MultipartFile imageFile,
            AcceptLanguage language) {

        log.info("Creating question with image for topic ID: {}", request.getTopicId());

        validateQuestionRequest(request);

        // Upload image if provided
        String imageUrl = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                FileUploadResponse uploadResponse = fileStorageManager.uploadFile(imageFile, "questions");
                imageUrl = uploadResponse.getFileUrl();
                log.info("Question image uploaded: {}", imageUrl);
            } catch (Exception e) {
                log.error("Failed to upload question image", e);
                throw new BusinessException("error.question.image.upload.failed");
            }
        }

        // Override imageUrl from request if file was uploaded
        if (imageUrl != null) {
            request.setImageUrl(imageUrl);
        }

        return createQuestion(request, language);
    }

    /**
     * Update question with optional image replacement
     */
    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public QuestionResponse updateQuestionWithImage(
            Long id,
            QuestionRequest request,
            MultipartFile imageFile,
            AcceptLanguage language) {

        log.info("Updating question {} with image", id);

        validateQuestionRequest(request);

        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        String oldImageUrl = question.getImageUrl();

        // Handle image update if new file provided
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                // Upload new image
                FileUploadResponse uploadResponse = fileStorageManager.uploadFile(imageFile, "questions");
                request.setImageUrl(uploadResponse.getFileUrl());
                log.info("New question image uploaded: {}", uploadResponse.getFileUrl());

                // Delete old image if exists and is different
                if (oldImageUrl != null && !oldImageUrl.isEmpty() &&
                        !oldImageUrl.equals(uploadResponse.getFileUrl())) {
                    deleteImageSafely(oldImageUrl);
                }
            } catch (Exception e) {
                log.error("Failed to upload new question image", e);
                throw new BusinessException("error.question.image.upload.failed");
            }
        }

        return updateQuestion(id, request, language);
    }

    /**
     * Update only question image
     */
    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public QuestionResponse updateQuestionImage(Long id, MultipartFile imageFile, AcceptLanguage language) {
        log.info("Updating image for question: {}", id);

        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        if (imageFile == null || imageFile.isEmpty()) {
            throw new BusinessException("validation.file.required");
        }

        String oldImageUrl = question.getImageUrl();

        try {
            // Upload new image
            FileUploadResponse uploadResponse = fileStorageManager.uploadFile(imageFile, "questions");
            question.setImageUrl(uploadResponse.getFileUrl());
            questionRepository.save(question);

            log.info("Question image updated: {}", uploadResponse.getFileUrl());

            // Delete old image
            if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                deleteImageSafely(oldImageUrl);
            }

            return questionMapper.toResponse(question, language);

        } catch (Exception e) {
            log.error("Failed to update question image", e);
            throw new BusinessException("error.question.image.upload.failed");
        }
    }

    /**
     * Delete question image
     */
    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public QuestionResponse deleteQuestionImage(Long id, AcceptLanguage language) {
        log.info("Deleting image for question: {}", id);

        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        String imageUrl = question.getImageUrl();

        if (imageUrl != null && !imageUrl.isEmpty()) {
            deleteImageSafely(imageUrl);
            question.setImageUrl(null);
            questionRepository.save(question);
            log.info("Question image deleted: {}", imageUrl);
        } else {
            log.warn("No image to delete for question: {}", id);
        }

        return questionMapper.toResponse(question, language);
    }

    /**
     * Helper: Delete image file safely (no exception thrown)
     */
    private void deleteImageSafely(String imageUrl) {
        try {
            boolean deleted = fileStorageManager.deleteFile(imageUrl);
            if (deleted) {
                log.info("Image deleted successfully: {}", imageUrl);
            } else {
                log.warn("Image not found for deletion: {}", imageUrl);
            }
        } catch (Exception e) {
            log.error("Failed to delete image (non-critical): {}", imageUrl, e);
            // Don't throw exception - image deletion failure shouldn't block the operation
        }
    }

    // ============================================================
    // MODIFY YOUR EXISTING deleteQuestion METHOD
    // Add image cleanup before deleting question
    // ============================================================

    @CacheEvict(value = {"questions", "questionsByTopic"}, allEntries = true)
    public void deleteQuestion(Long id) {
        log.info("Deleting question: {}", id);

        Question question = questionRepository.findById(id)
                .filter(q -> !q.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.question.not.found"));

        // ✅ ADD THIS: Delete associated image
        if (question.getImageUrl() != null && !question.getImageUrl().isEmpty()) {
            deleteImageSafely(question.getImageUrl());
        }

        String deletedBy = SecurityUtils.getCurrentUser() != null
                ? SecurityUtils.getCurrentUser().getUsername()
                : "system";

        question.softDelete(deletedBy);
        questionRepository.save(question);

        if (question.getTopic() != null) {
            topicService.decrementQuestionCount(question.getTopic().getId());
        }

        log.info("Question deleted: {}", id);
    }
}
