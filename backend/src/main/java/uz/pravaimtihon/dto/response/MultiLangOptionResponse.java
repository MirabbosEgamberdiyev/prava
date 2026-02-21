package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Question option with all 4 language variants.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiLangOptionResponse {

    private Long id;
    private Integer optionIndex;
    private MultiLangText text;
}
