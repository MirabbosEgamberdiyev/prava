package uz.pravaimtihon.octagon;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.service.OctagonEloCalculator;
import uz.pravaimtihon.octagon.service.OctagonEloCalculator.EloResult;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Octagon ELO Calculator Formula & Tier Unit Tests")
class OctagonEloCalculatorTest {

    private OctagonEloCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new OctagonEloCalculator();
    }

    @Test
    @DisplayName("Bronze Match: Winner earns +15, Loser loses -15")
    void testBronzeMatch() {
        OctagonProfile p1 = OctagonProfile.builder()
                .userId("u1").eloRating(30).rank(OctagonRank.BRONZE).winStreak(0).build();
        OctagonProfile p2 = OctagonProfile.builder()
                .userId("u2").eloRating(40).rank(OctagonRank.BRONZE).winStreak(0).build();

        EloResult result = calculator.calculate(p1, p2, 8, 5);

        assertEquals(15, result.p1Delta);
        assertEquals(45, result.p1NewElo);
        assertEquals(-15, result.p2Delta);
        assertEquals(25, result.p2NewElo);
    }

    @Test
    @DisplayName("Win Streak Bonus: 3 or more consecutive wins awards +3 extra ELO")
    void testWinStreakBonus() {
        OctagonProfile p1 = OctagonProfile.builder()
                .userId("u1").eloRating(100).rank(OctagonRank.SILVER).winStreak(3).build();
        OctagonProfile p2 = OctagonProfile.builder()
                .userId("u2").eloRating(120).rank(OctagonRank.SILVER).winStreak(0).build();

        // Silver win is 18 + 3 bonus = 21
        EloResult result = calculator.calculate(p1, p2, 9, 7);

        assertEquals(21, result.p1Delta);
        assertEquals(121, result.p1NewElo);
        assertEquals(-15, result.p2Delta);
        assertEquals(105, result.p2NewElo);
    }

    @Test
    @DisplayName("Brilliant Tier Match: Win gives +25, Loss loses -10")
    void testBrilliantTierMatch() {
        OctagonProfile p1 = OctagonProfile.builder()
                .userId("u1").eloRating(400).rank(OctagonRank.BRILLIANT).winStreak(0).build();
        OctagonProfile p2 = OctagonProfile.builder()
                .userId("u2").eloRating(350).rank(OctagonRank.BRILLIANT).winStreak(0).build();

        EloResult result = calculator.calculate(p1, p2, 10, 8);

        assertEquals(25, result.p1Delta);
        assertEquals(425, result.p1NewElo);
        assertEquals(-10, result.p2Delta);
        assertEquals(340, result.p2NewElo);
    }

    @Test
    @DisplayName("Draw Match: Both players receive +2 ELO")
    void testDrawMatch() {
        OctagonProfile p1 = OctagonProfile.builder()
                .userId("u1").eloRating(180).rank(OctagonRank.GOLD).winStreak(2).build();
        OctagonProfile p2 = OctagonProfile.builder()
                .userId("u2").eloRating(200).rank(OctagonRank.GOLD).winStreak(1).build();

        EloResult result = calculator.calculate(p1, p2, 7, 7);

        assertEquals(2, result.p1Delta);
        assertEquals(182, result.p1NewElo);
        assertEquals(2, result.p2Delta);
        assertEquals(202, result.p2NewElo);
    }

    @Test
    @DisplayName("Floor Protection: ELO cannot drop below 0")
    void testFloorProtection() {
        OctagonProfile p1 = OctagonProfile.builder()
                .userId("u1").eloRating(50).rank(OctagonRank.BRONZE).winStreak(0).build();
        OctagonProfile p2 = OctagonProfile.builder()
                .userId("u2").eloRating(5).rank(OctagonRank.BRONZE).winStreak(0).build();

        // p2 has 5 ELO and loses 15 -> should floor at 0, actual delta is -5
        EloResult result = calculator.calculate(p1, p2, 8, 2);

        assertEquals(15, result.p1Delta);
        assertEquals(65, result.p1NewElo);
        assertEquals(0, result.p2NewElo);
        assertEquals(-5, result.p2Delta);
    }
}
