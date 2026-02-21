package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.request.PackageRequest;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.service.MessageService;

import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Service responsible for intelligent question selection and distribution.
 *
 * Features:
 * - Thread-safe question selection
 * - Minimal duplication algorithm (0-10% overlap)
 * - Manual question selection validation
 * - Usage counting for reused questions
 *
 * @author Prava Online Development Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class QuestionSelectionService {

    private final ExamPackageRepository packageRepository;
    private final QuestionRepository questionRepository;
    private final MessageService messageService;

    /**
     * Thread-safety lock for question selection.
     * Prevents race conditions when multiple admins create packages simultaneously.
     */
    private final ReentrantLock questionSelectionLock = new ReentrantLock();

    /**
     * Maximum allowed question overlap between packages (10%).
     * Example: For 20-question package, maximum 2 questions can be reused.
     */
    public static final double MAX_QUESTION_OVERLAP_PERCENTAGE = 0.10;

    /**
     * Minimum unique questions required (80%).
     * Example: For 20-question package, at least 16 must be brand new.
     */
    public static final int MINIMUM_UNIQUE_QUESTIONS_PERCENTAGE = 80;

    /**
     * Main entry point for question selection with thread safety.
     *
     * @param pkg      The package being created/updated
     * @param request  Package request with generation type and question count
     * @param language User's preferred language for error messages
     * @return Set of selected questions
     */
    public Set<Question> selectQuestionsWithIntelligentDistribution(
            ExamPackage pkg,
            PackageRequest request,
            AcceptLanguage language
    ) {
        questionSelectionLock.lock();
        try {
            return switch (request.getGenerationType()) {
                case MANUAL -> selectManualQuestions(request, language);
                case AUTO_RANDOM -> selectQuestionsWithMinimalDuplication(
                        request.getQuestionCount(),
                        null,
                        language
                );
                case AUTO_TOPIC -> selectQuestionsWithMinimalDuplication(
                        request.getQuestionCount(),
                        pkg.getTopic(),
                        language
                );
            };
        } finally {
            questionSelectionLock.unlock();
        }
    }

    /**
     * CORE ALGORITHM: Select questions with minimal duplication.
     *
     * Algorithm:
     * 1. Get all currently used question IDs across packages
     * 2. Stream questions and separate unused vs used
     * 3. Prioritize completely unused questions first
     * 4. Only reuse questions when absolutely necessary
     * 5. Distribute reused questions evenly (prefer least-used)
     * 6. Respect maximum overlap limits (10%)
     *
     * @param count    Number of questions needed
     * @param topic    Topic filter (null for random from all topics)
     * @param language User's preferred language for error messages
     * @return Set of selected questions
     * @throws BusinessException If insufficient questions available
     */
    public Set<Question> selectQuestionsWithMinimalDuplication(
            int count,
            Topic topic,
            AcceptLanguage language
    ) {
        String topicInfo = topic != null ? topic.getCode() + " (" + topic.getName(language) + ")" : "ALL";
        log.info("🔍 Starting intelligent question selection (streaming)");
        log.info("   Required: {} questions", count);
        log.info("   Topic: {}", topicInfo);
        log.info("   Language: {}", language.getCode());
        log.info("   Max overlap allowed: {}%", (int) (MAX_QUESTION_OVERLAP_PERCENTAGE * 100));

        // STEP 1: Get ALL used question IDs
        Set<Long> usedQuestionIds = packageRepository.findAllUsedQuestionIds();
        log.info("📊 Questions already in use: {}", usedQuestionIds.size());

        // STEP 2: Validate total question count first (lightweight query)
        long totalAvailable = topic == null
                ? questionRepository.countActiveQuestions()
                : questionRepository.countActiveQuestionsByTopic(topic);

        if (totalAvailable == 0) {
            String errorKey = topic == null
                    ? "error.package.no.questions"
                    : "error.package.no.topic.questions";

            throw new BusinessException(
                    messageService.getMessage(errorKey,
                            topic != null ? new Object[]{topic.getName(language)} : null,
                            language)
            );
        }

        if (totalAvailable < count) {
            throw new BusinessException(
                    messageService.getMessage("error.package.insufficient.questions",
                            new Object[]{count, totalAvailable},
                            language)
            );
        }

        log.info("📦 Total available questions: {}", totalAvailable);

        // STEP 3: Stream questions and separate unused vs used
        List<Question> completelyUnusedQuestions = new ArrayList<>();
        List<Question> previouslyUsedQuestions = new ArrayList<>();

        try (Stream<Question> questionStream = topic == null
                ? questionRepository.streamActiveQuestions()
                : questionRepository.streamActiveQuestionsByTopic(topic)) {

            questionStream.forEach(question -> {
                if (usedQuestionIds.contains(question.getId())) {
                    previouslyUsedQuestions.add(question);
                } else {
                    completelyUnusedQuestions.add(question);
                }
            });
        }

        log.info("✨ Unused questions: {}", completelyUnusedQuestions.size());
        log.info("♻️ Previously used questions: {}", previouslyUsedQuestions.size());

        // STEP 4: Validate sufficient unique questions
        int minimumUniqueRequired = (int) Math.ceil(count * MINIMUM_UNIQUE_QUESTIONS_PERCENTAGE / 100.0);

        if (completelyUnusedQuestions.size() < minimumUniqueRequired) {
            log.warn("⚠️ Only {} unused questions available, but {} required ({}% of {})",
                    completelyUnusedQuestions.size(),
                    minimumUniqueRequired,
                    MINIMUM_UNIQUE_QUESTIONS_PERCENTAGE,
                    count);

            long totalQuestionsInLists = completelyUnusedQuestions.size() + previouslyUsedQuestions.size();
            if (totalQuestionsInLists < count) {
                throw new BusinessException(
                        messageService.getMessage("error.package.insufficient.unique.questions",
                                new Object[]{count, totalQuestionsInLists},
                                language)
                );
            }
        }

        // STEP 5: Intelligent Selection
        Set<Question> selectedQuestions = new LinkedHashSet<>();
        Random random = new Random();

        // 5a. First priority: Use ALL unused questions (up to count needed)
        Collections.shuffle(completelyUnusedQuestions, random);
        int unusedToTake = Math.min(count, completelyUnusedQuestions.size());
        selectedQuestions.addAll(completelyUnusedQuestions.subList(0, unusedToTake));

        log.info("✅ Selected {} completely unused questions ({}%)",
                unusedToTake,
                (unusedToTake * 100 / count));

        // 5b. If still need more, take from previously used (with strict limit)
        if (selectedQuestions.size() < count) {
            int remainingNeeded = count - selectedQuestions.size();
            int maxAllowedReuse = (int) Math.ceil(count * MAX_QUESTION_OVERLAP_PERCENTAGE);
            int actualReuse = Math.min(remainingNeeded, maxAllowedReuse);

            if (actualReuse > remainingNeeded) {
                actualReuse = remainingNeeded;
            }

            // Use batch query for usage counts
            Set<Long> usedInList = previouslyUsedQuestions.stream()
                    .map(Question::getId)
                    .collect(Collectors.toSet());
            Map<Long, Long> questionUsageCount = getQuestionUsageCount(usedInList);

            // Sort by usage frequency - prefer least-used questions
            previouslyUsedQuestions.sort(Comparator.comparingLong(q ->
                    questionUsageCount.getOrDefault(q.getId(), 0L)));

            // Add some randomness to avoid always picking same questions
            int shuffleLimit = Math.min(previouslyUsedQuestions.size(), actualReuse * 2);
            if (shuffleLimit > 0) {
                Collections.shuffle(previouslyUsedQuestions.subList(0, shuffleLimit), random);
            }

            if (previouslyUsedQuestions.size() < actualReuse) {
                long totalQuestionsInLists = completelyUnusedQuestions.size() + previouslyUsedQuestions.size();
                throw new BusinessException(
                        messageService.getMessage("error.package.insufficient.unique.questions",
                                new Object[]{count, totalQuestionsInLists},
                                language)
                );
            }

            selectedQuestions.addAll(previouslyUsedQuestions.subList(0, actualReuse));

            log.info("⚠️ Added {} reused questions ({}% overlap) - within {}% limit",
                    actualReuse,
                    (actualReuse * 100 / count),
                    (int) (MAX_QUESTION_OVERLAP_PERCENTAGE * 100));
        }

        // STEP 6: Final Validation
        if (selectedQuestions.size() != count) {
            log.error("❌ Selection failed: expected {}, got {}", count, selectedQuestions.size());
            throw new BusinessException(
                    messageService.getMessage("error.package.question.selection.failed", language)
            );
        }

        // STEP 7: Log Statistics
        long actualOverlap = selectedQuestions.stream()
                .filter(q -> usedQuestionIds.contains(q.getId()))
                .count();

        double overlapPercentage = (actualOverlap * 100.0) / selectedQuestions.size();

        log.info("📈 SELECTION COMPLETED:");
        log.info("   Total selected: {}", selectedQuestions.size());
        log.info("   Brand new: {} ({}%)",
                selectedQuestions.size() - actualOverlap,
                String.format("%.1f", 100 - overlapPercentage));
        log.info("   Reused: {} ({}%)",
                actualOverlap,
                String.format("%.1f", overlapPercentage));

        if (overlapPercentage > MAX_QUESTION_OVERLAP_PERCENTAGE * 100 + 1) {
            log.error("⚠️ WARNING: Overlap ({}%) exceeds limit ({}%)!",
                    String.format("%.1f", overlapPercentage),
                    (int) (MAX_QUESTION_OVERLAP_PERCENTAGE * 100));
        }

        return selectedQuestions;
    }

    /**
     * MANUAL selection: Admin specifies exact question IDs.
     *
     * Validates:
     * - All question IDs exist
     * - No duplicate IDs
     * - All questions are active
     * - All questions exist in database
     *
     * @param request  Package request with question IDs
     * @param language User's preferred language for error messages
     * @return Set of selected questions
     */
    public Set<Question> selectManualQuestions(PackageRequest request, AcceptLanguage language) {
        if (request.getQuestionIds() == null || request.getQuestionIds().isEmpty()) {
            throw new BusinessException(
                    messageService.getMessage("error.package.questions.required", language)
            );
        }

        List<Long> ids = request.getQuestionIds();
        Set<Long> uniqueIds = new HashSet<>(ids);

        // Check for duplicate IDs
        if (uniqueIds.size() != ids.size()) {
            log.error("❌ Duplicate question IDs found: requested={}, unique={}",
                    ids.size(), uniqueIds.size());
            throw new BusinessException(
                    messageService.getMessage("error.package.duplicate.questions", language)
            );
        }

        // Fetch questions
        List<Question> questions = questionRepository.findAllById(new ArrayList<>(uniqueIds));

        // Validate all IDs exist
        if (questions.size() != uniqueIds.size()) {
            Set<Long> foundIds = questions.stream()
                    .map(Question::getId)
                    .collect(Collectors.toSet());
            Set<Long> missingIds = new HashSet<>(uniqueIds);
            missingIds.removeAll(foundIds);

            log.error("❌ Questions not found: {}", missingIds);
            throw new BusinessException(
                    messageService.getMessage("error.package.invalid.questions", language)
            );
        }

        // Validate all questions are active
        List<Question> inactiveQuestions = questions.stream()
                .filter(q -> !q.getIsActive() || q.getDeleted())
                .toList();

        if (!inactiveQuestions.isEmpty()) {
            log.error("❌ Inactive questions found: {}",
                    inactiveQuestions.stream().map(Question::getId).toList());
            throw new BusinessException(
                    messageService.getMessage("error.package.inactive.questions", language)
            );
        }

        log.info("✅ Manual selection validated: {} unique questions", questions.size());
        return new LinkedHashSet<>(questions);
    }

    /**
     * Get usage count for each question across all packages.
     * Uses single batch query instead of N individual queries.
     *
     * @param usedQuestionIds Set of question IDs to check
     * @return Map of question ID to usage count
     */
    public Map<Long, Long> getQuestionUsageCount(Set<Long> usedQuestionIds) {
        if (usedQuestionIds == null || usedQuestionIds.isEmpty()) {
            return new HashMap<>();
        }

        // Single batch query replaces N individual queries
        List<Object[]> results = packageRepository.countPackagesUsingQuestionsBatch(usedQuestionIds);

        Map<Long, Long> usageCount = new HashMap<>();
        for (Object[] row : results) {
            Long questionId = (Long) row[0];
            Long count = (Long) row[1];
            usageCount.put(questionId, count);
        }

        // Questions not in result have count 0
        for (Long questionId : usedQuestionIds) {
            usageCount.putIfAbsent(questionId, 0L);
        }

        log.debug("📊 Batch loaded usage counts for {} questions in single query", usedQuestionIds.size());
        return usageCount;
    }

    /**
     * Log detailed overlap statistics for monitoring.
     *
     * @param packageId ID of the package
     * @param questions Set of questions in the package
     * @param language  User's preferred language
     */
    public void logQuestionOverlapStatistics(Long packageId, Set<Question> questions, AcceptLanguage language) {
        Set<Long> questionIds = questions.stream()
                .map(Question::getId)
                .collect(Collectors.toSet());

        Map<Long, Long> usageCounts = getQuestionUsageCount(questionIds);

        // Count questions used in more than 1 package (overlap)
        long overlapCount = usageCounts.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .count();

        log.info("📊 Package {} overlap analysis (Language: {}):", packageId, language.getCode());
        log.info("   Questions with overlap: {}/{}", overlapCount, questions.size());
        log.info("   Unique questions: {}/{} ({}%)",
                questions.size() - overlapCount,
                questions.size(),
                String.format("%.1f", ((questions.size() - overlapCount) * 100.0 / questions.size())));
    }

    /**
     * Log regeneration statistics.
     *
     * @param oldQuestions Previous questions in the package
     * @param newQuestions New questions after regeneration
     * @param language     User's preferred language
     */
    public void logRegenerationStatistics(
            Set<Question> oldQuestions,
            Set<Question> newQuestions,
            AcceptLanguage language
    ) {
        Set<Long> oldIds = oldQuestions.stream().map(Question::getId).collect(Collectors.toSet());
        Set<Long> newIds = newQuestions.stream().map(Question::getId).collect(Collectors.toSet());

        long retained = oldIds.stream().filter(newIds::contains).count();
        long removed = oldIds.size() - retained;
        long added = newIds.size() - retained;

        log.info("🔄 Regeneration statistics (Language: {}):", language.getCode());
        log.info("   Total questions: {}", newQuestions.size());
        log.info("   Retained: {}", retained);
        log.info("   Removed: {}", removed);
        log.info("   Added: {}", added);
    }
}
