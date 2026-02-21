package uz.pravaimtihon.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_answers", indexes = {
        @Index(name = "idx_answer_session", columnList = "exam_session_id"),
        @Index(name = "idx_answer_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAnswer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Column(name = "selected_option_index")
    private Integer selectedOptionIndex;

    @Column(name = "correct_option_index", nullable = false)
    private Integer correctOptionIndex;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @Column(name = "time_spent_seconds")
    private Long timeSpentSeconds;

    public void submitAnswer(Integer selectedIndex, Long timeSpent) {
        this.selectedOptionIndex = selectedIndex;
        this.timeSpentSeconds = timeSpent;
        this.answeredAt = LocalDateTime.now();
        this.isCorrect = selectedIndex != null &&
                selectedIndex.equals(correctOptionIndex);
    }

    public boolean isAnswered() {
        return selectedOptionIndex != null;
    }
}