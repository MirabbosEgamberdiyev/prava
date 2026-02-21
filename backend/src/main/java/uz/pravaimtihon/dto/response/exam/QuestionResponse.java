package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Savol - 4 tilda.
 * visibleMode = true bo'lsa, correctOptionIndex va explanation ham qaytariladi.
 * visibleMode = false (secure) bo'lsa, faqat savol va variantlar.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestionResponse {

    private Long id;
    private Integer order;
    private LocalizedText text;
    private String imageUrl;
    private List<OptionResponse> options;

    /**
     * To'g'ri javob indeksi.
     * Faqat visibleMode = true bo'lganda qaytariladi.
     * Frontend instant validation uchun ishlatadi.
     */
    private Integer correctOptionIndex;

    /**
     * Tushuntirish - 4 tilda.
     * Faqat visibleMode = true bo'lganda qaytariladi.
     */
    private LocalizedText explanation;
}
