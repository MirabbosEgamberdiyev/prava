package uz.pravaimtihon.octagon.service;

import org.springframework.stereotype.Component;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonRank;

@Component
public class OctagonEloCalculator {

    public static class EloResult {
        public final int p1NewElo;
        public final int p2NewElo;
        public final int p1Delta;
        public final int p2Delta;

        public EloResult(int p1NewElo, int p2NewElo, int p1Delta, int p2Delta) {
            this.p1NewElo = p1NewElo;
            this.p2NewElo = p2NewElo;
            this.p1Delta = p1Delta;
            this.p2Delta = p2Delta;
        }
    }

    /**
     * Calculate new ELO ratings and deltas based on match outcome.
     * @param p1 Profile of player 1
     * @param p2 Profile of player 2
     * @param p1Score Score of player 1 (0..10)
     * @param p2Score Score of player 2 (0..10)
     */
    public EloResult calculate(OctagonProfile p1, OctagonProfile p2, int p1Score, int p2Score) {
        OctagonRank r1 = p1.getRank();
        OctagonRank r2 = p2.getRank();

        int p1Delta;
        int p2Delta;

        if (p1Score > p2Score) {
            // Player 1 wins
            int streakBonus = p1.getWinStreak() >= 3 ? 3 : 0;
            p1Delta = r1.getDeltaWin() + streakBonus;
            p2Delta = -r2.getDeltaLoss();
        } else if (p2Score > p1Score) {
            // Player 2 wins
            int streakBonus = p2.getWinStreak() >= 3 ? 3 : 0;
            p1Delta = -r1.getDeltaLoss();
            p2Delta = r2.getDeltaWin() + streakBonus;
        } else {
            // Draw
            p1Delta = 2;
            p2Delta = 2;
        }

        int p1NewElo = Math.max(0, p1.getEloRating() + p1Delta);
        int p2NewElo = Math.max(0, p2.getEloRating() + p2Delta);

        // Adjust actual deltas if hit 0 floor
        int actualP1Delta = p1NewElo - p1.getEloRating();
        int actualP2Delta = p2NewElo - p2.getEloRating();

        return new EloResult(p1NewElo, p2NewElo, actualP1Delta, actualP2Delta);
    }
}
