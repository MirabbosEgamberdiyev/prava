package uz.pravaimtihon.dto.mapper;

import org.springframework.stereotype.Component;
import uz.pravaimtihon.dto.response.exam.*;
import uz.pravaimtihon.entity.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Imtihon response mapper.
 * Entity -> DTO o'tkazish.
 * Barcha tillar bir vaqtda qaytariladi.
 */
@Component
public class ExamResponseMapper {

    // ============================================
    // LocalizedText mapping
    // ============================================

    public LocalizedText toLocalizedText(String uzl, String uzc, String en, String ru) {
        return LocalizedText.of(uzl, uzc, en, ru);
    }

    public LocalizedText toPackageName(ExamPackage pkg) {
        if (pkg == null) return null;
        return LocalizedText.of(
                pkg.getNameUzl(),
                pkg.getNameUzc(),
                pkg.getNameEn(),
                pkg.getNameRu()
        );
    }

    public LocalizedText toTopicName(Topic topic) {
        if (topic == null) return null;
        return LocalizedText.of(
                topic.getNameUzl(),
                topic.getNameUzc(),
                topic.getNameEn(),
                topic.getNameRu()
        );
    }

    public LocalizedText toQuestionText(Question q) {
        if (q == null) return null;
        return LocalizedText.of(
                q.getTextUzl(),
                q.getTextUzc(),
                q.getTextEn(),
                q.getTextRu()
        );
    }

    public LocalizedText toExplanation(Question q) {
        if (q == null) return null;
        return LocalizedText.of(
                q.getExplanationUzl(),
                q.getExplanationUzc(),
                q.getExplanationEn(),
                q.getExplanationRu()
        );
    }

    public LocalizedText toOptionText(QuestionOption opt) {
        if (opt == null) return null;
        return LocalizedText.of(
                opt.getTextUzl(),
                opt.getTextUzc(),
                opt.getTextEn(),
                opt.getTextRu()
        );
    }

    // ============================================
    // Option mapping
    // ============================================

    public OptionResponse toOptionResponse(QuestionOption opt) {
        if (opt == null) return null;
        return OptionResponse.builder()
                .id(opt.getId())
                .index(opt.getOptionIndex())
                .text(toOptionText(opt))
                .build();
    }

    public List<OptionResponse> toOptionResponses(List<QuestionOption> options) {
        if (options == null) return List.of();
        return options.stream()
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(QuestionOption::getOptionIndex))
                .map(this::toOptionResponse)
                .collect(Collectors.toList());
    }

    // ============================================
    // Question mapping
    // ============================================

    /**
     * Savol mapping - visibleMode bo'lsa to'g'ri javob va tushuntirish qaytariladi
     */
    public QuestionResponse toQuestionResponse(Question q, int order, boolean visibleMode) {
        if (q == null) return null;

        QuestionResponse.QuestionResponseBuilder builder = QuestionResponse.builder()
                .id(q.getId())
                .order(order)
                .text(toQuestionText(q))
                .imageUrl(q.getImageUrl())
                .options(toOptionResponses(q.getOptions()));

        // Visible mode - to'g'ri javob va tushuntirishni qo'shish
        if (visibleMode) {
            builder.correctOptionIndex(q.getCorrectAnswerIndex());
            builder.explanation(toExplanation(q));
        }

        return builder.build();
    }

    public List<QuestionResponse> toQuestionResponses(List<Question> questions, boolean visibleMode) {
        if (questions == null) return List.of();
        List<QuestionResponse> result = new java.util.ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            result.add(toQuestionResponse(questions.get(i), i, visibleMode));
        }
        return result;
    }

    // ============================================
    // Answer detail mapping (natija uchun)
    // ============================================

    public AnswerDetailResponse toAnswerDetailResponse(ExamAnswer answer) {
        if (answer == null || answer.getQuestion() == null) return null;

        Question q = answer.getQuestion();

        return AnswerDetailResponse.builder()
                .questionId(q.getId())
                .questionOrder(answer.getQuestionOrder())
                .questionText(toQuestionText(q))
                .imageUrl(q.getImageUrl())
                .options(toOptionResponses(q.getOptions()))
                .selectedOptionIndex(answer.getSelectedOptionIndex())
                .correctOptionIndex(answer.getCorrectOptionIndex())
                .isCorrect(answer.getIsCorrect())
                .explanation(toExplanation(q))
                .timeSpentSeconds(answer.getTimeSpentSeconds())
                .build();
    }

    public List<AnswerDetailResponse> toAnswerDetailResponses(List<ExamAnswer> answers) {
        if (answers == null) return List.of();
        return answers.stream()
                .sorted(Comparator.comparing(ExamAnswer::getQuestionOrder))
                .map(this::toAnswerDetailResponse)
                .collect(Collectors.toList());
    }

    // ============================================
    // Check answer mapping
    // ============================================

    public CheckAnswerResponse toCheckAnswerResponse(Question q, Integer selectedIndex) {
        if (q == null) return null;

        boolean isCorrect = selectedIndex != null &&
                selectedIndex.equals(q.getCorrectAnswerIndex());

        return CheckAnswerResponse.builder()
                .questionId(q.getId())
                .isCorrect(isCorrect)
                .correctOptionIndex(q.getCorrectAnswerIndex())
                .explanation(toExplanation(q))
                .build();
    }

    // ============================================
    // History mapping
    // ============================================

    public ExamHistoryResponse toHistoryResponse(ExamSession session) {
        if (session == null) return null;

        ExamPackage pkg = session.getExamPackage();
        Ticket ticket = session.getTicket();
        Topic topic = pkg != null ? pkg.getTopic() : (ticket != null ? ticket.getTopic() : null);

        int totalQuestions = session.getTotalQuestions() != null ? session.getTotalQuestions() : 0;
        int correctCount = session.getCorrectCount() != null ? session.getCorrectCount() : 0;
        int answeredCount = session.getAnsweredCount() != null ? session.getAnsweredCount() : 0;
        int incorrectCount = answeredCount - correctCount;
        int unansweredCount = totalQuestions - answeredCount;

        return ExamHistoryResponse.builder()
                .sessionId(session.getId())
                .packageId(pkg != null ? pkg.getId() : null)
                .packageName(toPackageName(pkg))
                .ticketId(ticket != null ? ticket.getId() : null)
                .ticketNumber(ticket != null ? ticket.getTicketNumber() : null)
                .topicId(topic != null ? topic.getId() : null)
                .topicName(toTopicName(topic))
                .status(session.getStatus())
                .isMarathonMode(session.isMarathonMode())
                .isTicketMode(session.isTicketMode())
                .totalQuestions(totalQuestions)
                .correctCount(correctCount)
                .incorrectCount(incorrectCount)
                .unansweredCount(unansweredCount)
                .percentage(session.getPercentage())
                .isPassed(session.getIsPassed())
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .durationSeconds(session.getDurationSeconds())
                .build();
    }

    public List<ExamHistoryResponse> toHistoryResponses(List<ExamSession> sessions) {
        if (sessions == null) return null;
        return sessions.stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());
    }
}
