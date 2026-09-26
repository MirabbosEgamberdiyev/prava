package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Audit P1-B9: 5 xonali kodni brute-force qilish global to'xtatgich bilan cheklanadi. */
class TelegramTokenStoreTest {

    @Test
    void validCodeIsConsumedOnce() {
        TelegramTokenStore store = new TelegramTokenStore();
        String code = store.generateToken(42L, "Ali", null, null);

        assertThat(store.validateAndConsume(code)).isNotNull();
        assertThat(store.validateAndConsume(code)).isNull();
    }

    @Test
    void manyWrongGuessesPauseValidationForEveryone() {
        TelegramTokenStore store = new TelegramTokenStore();
        String code = store.generateToken(7L, "Vali", null, null);
        String wrong = code.equals("00000") ? "00001" : "00000";

        for (int i = 0; i < 30; i++) {
            assertThat(store.validateAndConsume(wrong)).isNull();
        }
        // To'xtatgich ochiq — hatto to'g'ri kod ham hozircha qabul qilinmaydi
        assertThat(store.validateAndConsume(code)).isNull();
    }
}
