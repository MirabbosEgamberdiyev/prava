package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Question with all 4 language variants for text, options, and explanation.
 * Does NOT include correct answer (revealed after submission).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiLangQuestionResponse {

    private Long id;
    private Integer questionOrder;
    private MultiLangText text;
    private String imageUrl;
    private List<MultiLangOptionResponse> options;
}
