package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.AcceptLanguage;

@Entity
@Table(name = "question_options", indexes = {
        @Index(name = "idx_option_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOption extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "option_index")
    private Integer optionIndex; // 0, 1, 2, 3...

    // Multi-language option texts
    @Column(name = "text_uzl", length = 500)
    private String textUzl;

    @Column(name = "text_uzc", length = 500)
    private String textUzc;

    @Column(name = "text_en", length = 500)
    private String textEn;

    @Column(name = "text_ru", length = 500)
    private String textRu;

    public String getText(AcceptLanguage language) {
        return switch (language) {
            case UZL -> textUzl;
            case UZC -> textUzc != null ? textUzc : textUzl;
            case EN -> textEn != null ? textEn : textUzl;
            case RU -> textRu != null ? textRu : textUzl;
        };
    }
}
