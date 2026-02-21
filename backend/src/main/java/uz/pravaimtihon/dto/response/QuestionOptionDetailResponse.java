package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin uchun savol variant detail - barcha 4 til varianti.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOptionDetailResponse {
    private Long id;
    private Integer optionIndex;
    private String textUzl;
    private String textUzc;
    private String textEn;
    private String textRu;
}
