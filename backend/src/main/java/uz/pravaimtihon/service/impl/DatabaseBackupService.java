package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.response.DatabaseBackupResponse;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.repository.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Database Backup Service - barcha ma'lumotlarni JSON formatda export qilish
 * Faqat SUPER_ADMIN foydalanishi mumkin
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DatabaseBackupService {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ExamPackageRepository examPackageRepository;
    private final TicketRepository ticketRepository;
    private final ExamSessionRepository examSessionRepository;
    private final ExamAnswerRepository examAnswerRepository;
    private final UserStatisticsRepository userStatisticsRepository;

    private static final String BACKUP_VERSION = "1.0";

    /**
     * Barcha ma'lumotlarni yig'ib backup qilish
     */
    @Transactional(readOnly = true)
    public DatabaseBackupResponse createFullBackup() {
        log.info("DATABASE BACKUP STARTED at {}", LocalDateTime.now());
        long startTime = System.currentTimeMillis();

        // Barcha ma'lumotlarni yuklash
        List<Map<String, Object>> users = exportUsers();
        List<Map<String, Object>> topics = exportTopics();
        List<Map<String, Object>> questions = exportQuestions();
        List<Map<String, Object>> questionOptions = exportQuestionOptions();
        List<Map<String, Object>> examPackages = exportExamPackages();
        List<Map<String, Object>> packageQuestionIds = exportPackageQuestions();
        List<Map<String, Object>> tickets = exportTickets();
        List<Map<String, Object>> ticketQuestionIds = exportTicketQuestions();
        List<Map<String, Object>> examSessions = exportExamSessions();
        List<Map<String, Object>> examAnswers = exportExamAnswers();
        List<Map<String, Object>> userStatistics = exportUserStatistics();

        // Statistika
        long totalRecords = users.size() + topics.size() + questions.size() +
                questionOptions.size() + examPackages.size() + tickets.size() +
                examSessions.size() + examAnswers.size() + userStatistics.size();

        DatabaseBackupResponse.BackupStatistics statistics = DatabaseBackupResponse.BackupStatistics.builder()
                .userCount(users.size())
                .topicCount(topics.size())
                .questionCount(questions.size())
                .questionOptionCount(questionOptions.size())
                .examPackageCount(examPackages.size())
                .ticketCount(tickets.size())
                .examSessionCount(examSessions.size())
                .examAnswerCount(examAnswers.size())
                .userStatisticsCount(userStatistics.size())
                .totalRecords(totalRecords)
                .build();

        long duration = System.currentTimeMillis() - startTime;
        log.info("DATABASE BACKUP COMPLETED in {} ms. Total records: {}", duration, totalRecords);

        return DatabaseBackupResponse.builder()
                .backupDate(LocalDateTime.now())
                .backupVersion(BACKUP_VERSION)
                .statistics(statistics)
                .users(users)
                .topics(topics)
                .questions(questions)
                .questionOptions(questionOptions)
                .examPackages(examPackages)
                .packageQuestionIds(packageQuestionIds)
                .tickets(tickets)
                .ticketQuestionIds(ticketQuestionIds)
                .examSessions(examSessions)
                .examAnswers(examAnswers)
                .userStatistics(userStatistics)
                .build();
    }

    // ============================================
    // Export Methods - har bir entity uchun
    // ============================================

    private List<Map<String, Object>> exportUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", user.getId());
                    map.put("firstName", user.getFirstName());
                    map.put("lastName", user.getLastName());
                    map.put("phoneNumber", user.getPhoneNumber());
                    map.put("email", user.getEmail());
                    // passwordHash ni ham saqlaymiz (backup uchun kerak)
                    map.put("passwordHash", user.getPasswordHash());
                    map.put("role", user.getRole() != null ? user.getRole().name() : null);
                    map.put("preferredLanguage", user.getPreferredLanguage() != null ? user.getPreferredLanguage().name() : null);
                    map.put("isActive", user.getIsActive());
                    map.put("isEmailVerified", user.getIsEmailVerified());
                    map.put("isPhoneVerified", user.getIsPhoneVerified());
                    map.put("lastLoginAt", user.getLastLoginAt());
                    map.put("failedLoginAttempts", user.getFailedLoginAttempts());
                    map.put("googleId", user.getGoogleId());
                    map.put("telegramId", user.getTelegramId());
                    map.put("telegramUsername", user.getTelegramUsername());
                    map.put("oauthProvider", user.getOauthProvider() != null ? user.getOauthProvider().name() : null);
                    map.put("profileImageUrl", user.getProfileImageUrl());
                    map.put("accountLockedUntil", user.getAccountLockedUntil());
                    map.put("maxDevices", user.getMaxDevices());
                    map.put("activeDeviceCount", user.getActiveDeviceCount());
                    map.put("deviceLimitCustomized", user.getDeviceLimitCustomized());
                    // BaseEntity fields
                    putBaseFields(map, user);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportTopics() {
        return topicRepository.findAll().stream()
                .map(topic -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", topic.getId());
                    map.put("code", topic.getCode());
                    map.put("nameUzl", topic.getNameUzl());
                    map.put("nameUzc", topic.getNameUzc());
                    map.put("nameEn", topic.getNameEn());
                    map.put("nameRu", topic.getNameRu());
                    map.put("descriptionUzl", topic.getDescriptionUzl());
                    map.put("descriptionUzc", topic.getDescriptionUzc());
                    map.put("descriptionEn", topic.getDescriptionEn());
                    map.put("descriptionRu", topic.getDescriptionRu());
                    map.put("isActive", topic.getIsActive());
                    map.put("iconUrl", topic.getIconUrl());
                    map.put("displayOrder", topic.getDisplayOrder());
                    map.put("questionCount", topic.getQuestionCount());
                    putBaseFields(map, topic);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportQuestions() {
        return questionRepository.findAll().stream()
                .map(question -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", question.getId());
                    map.put("textUzl", question.getTextUzl());
                    map.put("textUzc", question.getTextUzc());
                    map.put("textEn", question.getTextEn());
                    map.put("textRu", question.getTextRu());
                    map.put("explanationUzl", question.getExplanationUzl());
                    map.put("explanationUzc", question.getExplanationUzc());
                    map.put("explanationEn", question.getExplanationEn());
                    map.put("explanationRu", question.getExplanationRu());
                    map.put("topicId", question.getTopic() != null ? question.getTopic().getId() : null);
                    map.put("difficulty", question.getDifficulty() != null ? question.getDifficulty().name() : null);
                    map.put("correctAnswerIndex", question.getCorrectAnswerIndex());
                    map.put("imageUrl", question.getImageUrl());
                    map.put("isActive", question.getIsActive());
                    map.put("timesUsed", question.getTimesUsed());
                    map.put("timesAnsweredCorrectly", question.getTimesAnsweredCorrectly());
                    putBaseFields(map, question);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportQuestionOptions() {
        return questionOptionRepository.findAll().stream()
                .map(option -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", option.getId());
                    map.put("questionId", option.getQuestion() != null ? option.getQuestion().getId() : null);
                    map.put("optionIndex", option.getOptionIndex());
                    map.put("textUzl", option.getTextUzl());
                    map.put("textUzc", option.getTextUzc());
                    map.put("textEn", option.getTextEn());
                    map.put("textRu", option.getTextRu());
                    putBaseFields(map, option);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportExamPackages() {
        return examPackageRepository.findAll().stream()
                .map(pkg -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", pkg.getId());
                    map.put("nameUzl", pkg.getNameUzl());
                    map.put("nameUzc", pkg.getNameUzc());
                    map.put("nameEn", pkg.getNameEn());
                    map.put("nameRu", pkg.getNameRu());
                    map.put("descriptionUzl", pkg.getDescriptionUzl());
                    map.put("descriptionUzc", pkg.getDescriptionUzc());
                    map.put("descriptionEn", pkg.getDescriptionEn());
                    map.put("descriptionRu", pkg.getDescriptionRu());
                    map.put("questionCount", pkg.getQuestionCount());
                    map.put("durationMinutes", pkg.getDurationMinutes());
                    map.put("passingScore", pkg.getPassingScore());
                    map.put("generationType", pkg.getGenerationType() != null ? pkg.getGenerationType().name() : null);
                    map.put("topicId", pkg.getTopic() != null ? pkg.getTopic().getId() : null);
                    map.put("isFree", pkg.getIsFree());
                    map.put("price", pkg.getPrice());
                    map.put("orderIndex", pkg.getOrderIndex());
                    map.put("isActive", pkg.getIsActive());
                    putBaseFields(map, pkg);
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Package-Question bog'lanishlarni export qilish (ManyToMany)
     */
    private List<Map<String, Object>> exportPackageQuestions() {
        return examPackageRepository.findAll().stream()
                .flatMap(pkg -> pkg.getQuestions().stream()
                        .map(question -> {
                            Map<String, Object> map = new LinkedHashMap<>();
                            map.put("packageId", pkg.getId());
                            map.put("questionId", question.getId());
                            return map;
                        }))
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportTickets() {
        return ticketRepository.findAll().stream()
                .map(ticket -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", ticket.getId());
                    map.put("ticketNumber", ticket.getTicketNumber());
                    map.put("nameUzl", ticket.getNameUzl());
                    map.put("nameUzc", ticket.getNameUzc());
                    map.put("nameEn", ticket.getNameEn());
                    map.put("nameRu", ticket.getNameRu());
                    map.put("descriptionUzl", ticket.getDescriptionUzl());
                    map.put("descriptionUzc", ticket.getDescriptionUzc());
                    map.put("descriptionEn", ticket.getDescriptionEn());
                    map.put("descriptionRu", ticket.getDescriptionRu());
                    map.put("examPackageId", ticket.getExamPackage() != null ? ticket.getExamPackage().getId() : null);
                    map.put("topicId", ticket.getTopic() != null ? ticket.getTopic().getId() : null);
                    map.put("durationMinutes", ticket.getDurationMinutes());
                    map.put("passingScore", ticket.getPassingScore());
                    map.put("isActive", ticket.getIsActive());
                    map.put("targetQuestionCount", ticket.getTargetQuestionCount());
                    putBaseFields(map, ticket);
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * Ticket-Question bog'lanishlarni export qilish (ManyToMany)
     */
    private List<Map<String, Object>> exportTicketQuestions() {
        return ticketRepository.findAll().stream()
                .flatMap(ticket -> {
                    List<Question> questions = ticket.getQuestions();
                    List<Map<String, Object>> result = new ArrayList<>();
                    for (int i = 0; i < questions.size(); i++) {
                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("ticketId", ticket.getId());
                        map.put("questionId", questions.get(i).getId());
                        map.put("questionOrder", i);
                        result.add(map);
                    }
                    return result.stream();
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportExamSessions() {
        return examSessionRepository.findAll().stream()
                .map(session -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", session.getId());
                    map.put("userId", session.getUser() != null ? session.getUser().getId() : null);
                    map.put("examPackageId", session.getExamPackage() != null ? session.getExamPackage().getId() : null);
                    map.put("ticketId", session.getTicket() != null ? session.getTicket().getId() : null);
                    map.put("status", session.getStatus() != null ? session.getStatus().name() : null);
                    map.put("language", session.getLanguage() != null ? session.getLanguage().name() : null);
                    map.put("startedAt", session.getStartedAt());
                    map.put("finishedAt", session.getFinishedAt());
                    map.put("expiresAt", session.getExpiresAt());
                    map.put("durationMinutes", session.getDurationMinutes());
                    map.put("totalQuestions", session.getTotalQuestions());
                    map.put("answeredCount", session.getAnsweredCount());
                    map.put("correctCount", session.getCorrectCount());
                    map.put("wrongCount", session.getWrongCount());
                    map.put("score", session.getScore());
                    map.put("percentage", session.getPercentage());
                    map.put("isPassed", session.getIsPassed());
                    putBaseFields(map, session);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportExamAnswers() {
        return examAnswerRepository.findAll().stream()
                .map(answer -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", answer.getId());
                    map.put("examSessionId", answer.getExamSession() != null ? answer.getExamSession().getId() : null);
                    map.put("questionId", answer.getQuestion() != null ? answer.getQuestion().getId() : null);
                    map.put("questionOrder", answer.getQuestionOrder());
                    map.put("selectedOptionIndex", answer.getSelectedOptionIndex());
                    map.put("correctOptionIndex", answer.getCorrectOptionIndex());
                    map.put("isCorrect", answer.getIsCorrect());
                    map.put("answeredAt", answer.getAnsweredAt());
                    map.put("timeSpentSeconds", answer.getTimeSpentSeconds());
                    putBaseFields(map, answer);
                    return map;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> exportUserStatistics() {
        return userStatisticsRepository.findAll().stream()
                .map(stats -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", stats.getId());
                    map.put("userId", stats.getUser() != null ? stats.getUser().getId() : null);
                    map.put("topic", stats.getTopic());
                    map.put("totalExams", stats.getTotalExams());
                    map.put("passedExams", stats.getPassedExams());
                    map.put("failedExams", stats.getFailedExams());
                    map.put("totalQuestions", stats.getTotalQuestions());
                    map.put("correctAnswers", stats.getCorrectAnswers());
                    map.put("averageScore", stats.getAverageScore());
                    map.put("bestScore", stats.getBestScore());
                    map.put("currentStreak", stats.getCurrentStreak());
                    map.put("longestStreak", stats.getLongestStreak());
                    map.put("totalTimeSpentSeconds", stats.getTotalTimeSpentSeconds());
                    putBaseFields(map, stats);
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * BaseEntity fieldlarni qo'shish (audit, soft delete, version)
     */
    private void putBaseFields(Map<String, Object> map, BaseEntity entity) {
        map.put("createdAt", entity.getCreatedAt());
        map.put("createdBy", entity.getCreatedBy());
        map.put("updatedAt", entity.getUpdatedAt());
        map.put("updatedBy", entity.getUpdatedBy());
        map.put("deleted", entity.getDeleted());
        map.put("deletedAt", entity.getDeletedAt());
        map.put("deletedBy", entity.getDeletedBy());
        map.put("version", entity.getVersion());
    }
}
