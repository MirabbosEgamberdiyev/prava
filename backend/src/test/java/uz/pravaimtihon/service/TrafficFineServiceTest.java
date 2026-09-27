package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/** B-08: summa = BHM koeffitsienti × BHM (butun so'mga yaxlitlanadi). */
class TrafficFineServiceTest {

    @Test
    void amountIsMultiplierTimesBhm() {
        BigDecimal bhm = new BigDecimal("375000");
        assertThat(TrafficFineService.amount(new BigDecimal("5"), bhm)).isEqualTo(1_875_000L);
        assertThat(TrafficFineService.amount(new BigDecimal("0.5"), bhm)).isEqualTo(187_500L);
        assertThat(TrafficFineService.amount(new BigDecimal("0.33"), bhm)).isEqualTo(123_750L);
        assertThat(TrafficFineService.amount(null, bhm)).isNull();
    }
}
