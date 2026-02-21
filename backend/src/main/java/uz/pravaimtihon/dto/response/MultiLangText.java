package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Multi-language text container for all 4 supported languages.
 * Used to return text in all languages simultaneously.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MultiLangText {

    private String uzl;  // O'zbek (Lotin)
    private String uzc;  // Ўзбек (Кирилл)
    private String en;   // English
    private String ru;   // Русский

    /**
     * Create from individual language values
     */
    public static MultiLangText of(String uzl, String uzc, String en, String ru) {
        return MultiLangText.builder()
                .uzl(uzl)
                .uzc(uzc != null ? uzc : uzl)
                .en(en != null ? en : uzl)
                .ru(ru != null ? ru : uzl)
                .build();
    }
}
