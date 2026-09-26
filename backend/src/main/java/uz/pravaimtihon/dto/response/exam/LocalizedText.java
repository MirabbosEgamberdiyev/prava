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
        // Bo'sh satr ham "tarjima yo'q" hisoblanadi — eng yaqin tildan olinadi (Localized.pick).
        return LocalizedText.builder()
                .uzl(uz.pravaimtihon.util.Localized.pick(uz.pravaimtihon.enums.AcceptLanguage.UZL, uzl, uzc, ru, en))
                .uzc(uz.pravaimtihon.util.Localized.pick(uz.pravaimtihon.enums.AcceptLanguage.UZC, uzl, uzc, ru, en))
                .en(uz.pravaimtihon.util.Localized.pick(uz.pravaimtihon.enums.AcceptLanguage.EN, uzl, uzc, ru, en))
                .ru(uz.pravaimtihon.util.Localized.pick(uz.pravaimtihon.enums.AcceptLanguage.RU, uzl, uzc, ru, en))
                .build();
    }

    /**
     * Faqat UZL tildan (boshqalari null)
     */
    public static LocalizedText ofUzl(String uzl) {
        return LocalizedText.builder().uzl(uzl).build();
    }
}
