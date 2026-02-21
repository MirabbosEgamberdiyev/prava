package uz.pravaimtihon.dto.mapper;

import org.mapstruct.*;
import org.springframework.data.domain.Page;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ✅ Exam Mapper - 100% Complete with Full Mapping
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ExamMapper {

    // ============================================
    // ✅ FIXED: ExamStartResponse with Questions
    // ============================================

    /**
     * Map ExamSession to ExamStartResponse with language
     * This is the main method used by ExamService
     */
    default ExamStartResponse toStartResponse(ExamSession session, AcceptLanguage language) {
        if (session == null) {
            return null;
        }

        AcceptLanguage targetLanguage = language != null ? language : session.getLanguage();

        return ExamStartResponse.builder()
                .sessionId(session.getId())
                .packageId(session.getExamPackage() != null ? session.getExamPackage().getId() : null)
                .packageName(session.getExamPackage() != null ?
                        session.getExamPackage().getName(targetLanguage) : null)
                .language(session.getLanguage())
                .totalQuestions(session.getTotalQuestions())
                .durationMinutes(session.getDurationMinutes())
                .passingScore(session.getExamPackage() != null ?
                        session.getExamPackage().getPassingScore() : null)
                .startedAt(session.getStartedAt())
                .expiresAt(session.getExpiresAt())
                .questions(mapExamAnswersToQuestions(session.getAnswers(), targetLanguage))
                .build();
    }

    // ============================================
    // ✅ FIXED: ExamResultResponse with Answer Details
    // ============================================

    /**
     * Map ExamSession to ExamResultResponse with language
     */
    default ExamResultResponse toResultResponse(ExamSession session, AcceptLanguage language) {
        if (session == null) {
            return null;
        }

        AcceptLanguage targetLanguage = language != null ? language : session.getLanguage();

        return ExamResultResponse.builder()
                .sessionId(session.getId())
                .packageId(session.getExamPackage() != null ? session.getExamPackage().getId() : null)
                .packageName(session.getExamPackage() != null ?
                        session.getExamPackage().getName(targetLanguage) : null)
                .status(session.getStatus())
                .totalQuestions(session.getTotalQuestions())
                .answeredCount(session.getAnsweredCount())
                .correctCount(session.getCorrectCount())
                .wrongCount(session.getWrongCount())
                .score(session.getScore())
                .percentage(session.getPercentage())
                .isPassed(session.getIsPassed())
                .passingScore(session.getExamPackage() != null ?
                        session.getExamPackage().getPassingScore() : null)
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .durationSeconds(session.getDurationSeconds())
                .answerDetails(mapExamAnswersToDetails(session.getAnswers(), targetLanguage))
                .build();
    }

    // ============================================
    // ✅ FIXED: ExamSessionResponse
    // ============================================

    /**
     * Map ExamSession to ExamSessionResponse with language
     */
    default ExamSessionResponse toSessionResponse(ExamSession session, AcceptLanguage language) {
        if (session == null) {
            return null;
        }

        AcceptLanguage targetLanguage = language != null ? language : session.getLanguage();

        return ExamSessionResponse.builder()
                .id(session.getId())
                .packageId(session.getExamPackage() != null ? session.getExamPackage().getId() : null)
                .packageName(session.getExamPackage() != null ?
                        session.getExamPackage().getName(targetLanguage) : null)
                .status(session.getStatus())
                .language(session.getLanguage())
                .totalQuestions(session.getTotalQuestions())
                .answeredCount(session.getAnsweredCount())
                .correctCount(session.getCorrectCount())
                .score(session.getScore())
                .percentage(session.getPercentage())
                .isPassed(session.getIsPassed())
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .durationSeconds(session.getDurationSeconds())
                .build();
    }

    // ============================================
    // ✅ Helper Methods for Mapping
    // ============================================

    /**
     * Map List<ExamAnswer> to List<ExamQuestionResponse>
     * Used in ExamStartResponse - questions WITHOUT answers
     */
    default List<ExamQuestionResponse> mapExamAnswersToQuestions(
            List<ExamAnswer> answers, AcceptLanguage language) {
        if (answers == null) {
            return null;
        }

        return answers.stream()
                .map(answer -> ExamQuestionResponse.builder()
                        .id(answer.getQuestion().getId())
                        .questionOrder(answer.getQuestionOrder())
                        .text(answer.getQuestion().getText(language))
                        .imageUrl(answer.getQuestion().getImageUrl())
                        .options(mapQuestionOptions(answer.getQuestion().getOptions(), language))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Map List<ExamAnswer> to List<ExamAnswerDetailResponse>
     * Used in ExamResultResponse - questions WITH answers and explanations
     */
    default List<ExamAnswerDetailResponse> mapExamAnswersToDetails(
            List<ExamAnswer> answers, AcceptLanguage language) {
        if (answers == null) {
            return null;
        }

        return answers.stream()
                .map(answer -> ExamAnswerDetailResponse.builder()
                        .questionId(answer.getQuestion().getId())
                        .questionOrder(answer.getQuestionOrder())
                        .questionText(answer.getQuestion().getText(language))
                        .imageUrl(answer.getQuestion().getImageUrl())
                        .options(mapQuestionOptions(answer.getQuestion().getOptions(), language))
                        .selectedOptionIndex(answer.getSelectedOptionIndex())
                        .correctOptionIndex(answer.getCorrectOptionIndex())
                        .isCorrect(answer.getIsCorrect())
                        .explanation(answer.getQuestion().getExplanation(language))
                        .timeSpentSeconds(answer.getTimeSpentSeconds())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Map List<QuestionOption> to List<ExamOptionResponse>
     */
    default List<ExamOptionResponse> mapQuestionOptions(
            List<QuestionOption> options, AcceptLanguage language) {
        if (options == null) {
            return null;
        }

        return options.stream()
                .map(option -> ExamOptionResponse.builder()
                        .id(option.getId())
                        .optionIndex(option.getOptionIndex())
                        .text(option.getText(language))
                        .build())
                .collect(Collectors.toList());
    }

    // ============================================
    // ✅ List and Page Mapping
    // ============================================

    /**
     * Map list of sessions with language
     */
    default List<ExamSessionResponse> toSessionResponseList(
            List<ExamSession> sessions, AcceptLanguage language) {
        if (sessions == null) {
            return null;
        }
        return sessions.stream()
                .map(session -> toSessionResponse(session, language))
                .collect(Collectors.toList());
    }

    /**
     * Map page of sessions with language
     */
    default PageResponse<ExamSessionResponse> toSessionPageResponse(
            Page<ExamSession> page, AcceptLanguage language) {
        if (page == null) {
            return PageResponse.<ExamSessionResponse>builder().build();
        }
        return PageResponse.<ExamSessionResponse>builder()
                .content(toSessionResponseList(page.getContent(), language))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }
}