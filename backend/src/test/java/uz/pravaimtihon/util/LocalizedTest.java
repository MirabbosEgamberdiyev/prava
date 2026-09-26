package uz.pravaimtihon.util;

import org.junit.jupiter.api.Test;
import uz.pravaimtihon.enums.AcceptLanguage;

import static org.assertj.core.api.Assertions.assertThat;

/** Audit P2 (i18n): bo'sh tarjima o'rniga eng yaqin tildagi matn ko'rsatiladi. */
class LocalizedTest {

    @Test
    void blankTranslationFallsBack() {
        assertThat(Localized.pick(AcceptLanguage.UZC, "Lotin", "  ", "Рус", "Eng")).isEqualTo("Lotin");
        assertThat(Localized.pick(AcceptLanguage.RU, "Lotin", "Кирилл", "", null)).isEqualTo("Lotin");
        assertThat(Localized.pick(AcceptLanguage.EN, "Lotin", "Кирилл", "Рус", "")).isEqualTo("Рус");
    }

    @Test
    void missingUzlUsesOtherLanguages() {
        assertThat(Localized.pick(AcceptLanguage.UZL, null, "Кирилл", "Рус", "Eng")).isEqualTo("Кирилл");
        assertThat(Localized.pick(AcceptLanguage.UZL, "", "", "", "Eng")).isEqualTo("Eng");
    }

    @Test
    void exactTranslationWins() {
        assertThat(Localized.pick(AcceptLanguage.RU, "Lotin", "Кирилл", "Рус", "Eng")).isEqualTo("Рус");
        assertThat(Localized.pick(null, "Lotin", "Кирилл", "Рус", "Eng")).isEqualTo("Lotin");
    }
}
