package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 4 tilda matn.
 * Barcha tillar bir vaqtda qaytariladi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LocalizedText {

    private String uzl;  // O'zbek (Lotin)
    private String uzc;  // Ўзбек (Кирилл)
    private String en;   // English
    private String ru;   // Русский

    /**
     * 4 ta tildan LocalizedText yaratish
     */
    public static LocalizedText of(String uzl, String uzc, String en, String ru) {
        return LocalizedText.builder()
                .uzl(uzl)
                .uzc(uzc != null ? uzc : uzl)
                .en(en != null ? en : uzl)
                .ru(ru != null ? ru : uzl)
                .build();
    }

    /**
     * Faqat UZL tildan (boshqalari null)
     */
    public static LocalizedText ofUzl(String uzl) {
        return LocalizedText.builder().uzl(uzl).build();
    }
}
