package uz.pravaimtihon.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Audit P2 (i18n): brauzer Accept-Language header'i to'g'ri tahlil qilinadi. */
class AcceptLanguageTest {

    @Test
    void appCodesStillWork() {
        assertThat(AcceptLanguage.fromCode("uzl")).isEqualTo(AcceptLanguage.UZL);
        assertThat(AcceptLanguage.fromCode("uzc")).isEqualTo(AcceptLanguage.UZC);
        assertThat(AcceptLanguage.fromCode("ru")).isEqualTo(AcceptLanguage.RU);
        assertThat(AcceptLanguage.fromCode("EN")).isEqualTo(AcceptLanguage.EN);
    }

    @Test
    void browserHeadersArePickedByPreference() {
        assertThat(AcceptLanguage.fromCode("ru-RU,ru;q=0.9,en-US;q=0.8")).isEqualTo(AcceptLanguage.RU);
        assertThat(AcceptLanguage.fromCode("en-US,en;q=0.9")).isEqualTo(AcceptLanguage.EN);
        assertThat(AcceptLanguage.fromCode("de-DE,ru;q=0.7")).isEqualTo(AcceptLanguage.RU);
        assertThat(AcceptLanguage.fromCode("en;q=0.3,ru;q=0.8")).isEqualTo(AcceptLanguage.RU);
    }

    @Test
    void uzbekScriptsAreDistinguished() {
        assertThat(AcceptLanguage.fromCode("uz-Cyrl-UZ")).isEqualTo(AcceptLanguage.UZC);
        assertThat(AcceptLanguage.fromCode("uz-UZ")).isEqualTo(AcceptLanguage.UZL);
        assertThat(AcceptLanguage.fromCode("uz")).isEqualTo(AcceptLanguage.UZL);
    }

    @Test
    void unknownFallsBackToUzl() {
        assertThat(AcceptLanguage.fromCode("de-DE,fr;q=0.5")).isEqualTo(AcceptLanguage.UZL);
        assertThat(AcceptLanguage.fromCode(null)).isEqualTo(AcceptLanguage.UZL);
        assertThat(AcceptLanguage.fromCode("xx")).isEqualTo(AcceptLanguage.UZL);
    }
}
