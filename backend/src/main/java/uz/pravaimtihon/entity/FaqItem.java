package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "faq_items", indexes = {
        @Index(name = "idx_faq_category", columnList = "category"),
        @Index(name = "idx_faq_is_active", columnList = "is_active"),
        @Index(name = "idx_faq_sort_order", columnList = "sort_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaqItem extends BaseEntity {

    @Column(name = "question_uzl", nullable = false, length = 500)
    private String questionUzl;

    @Column(name = "question_uzc", length = 500)
    private String questionUzc;

    @Column(name = "question_ru", length = 500)
    private String questionRu;

    @Column(name = "answer_uzl", nullable = false, columnDefinition = "TEXT")
    private String answerUzl;

    @Column(name = "answer_uzc", columnDefinition = "TEXT")
    private String answerUzc;

    @Column(name = "answer_ru", columnDefinition = "TEXT")
    private String answerRu;

    @Column(name = "category", length = 100)
    @Builder.Default
    private String category = "GENERAL";

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
