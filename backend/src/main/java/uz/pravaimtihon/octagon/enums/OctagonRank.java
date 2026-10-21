package uz.pravaimtihon.octagon.enums;

import lombok.Getter;

/**
 * Oktagon ligalari: Bronza → Kumush → Oltin → Platina → Olmos → Master.
 * {@code BRILLIANT} nomi bazadagi mavjud qatorlar uchun saqlab qolingan (ekranda "Olmos").
 */
@Getter
public enum OctagonRank {
    BRONZE(0, "🥉", "Bronza", 15, 15),
    SILVER(50, "🥈", "Kumush", 18, 15),
    GOLD(150, "🥇", "Oltin", 20, 12),
    PLATINUM(300, "💠", "Platina", 22, 12),
    BRILLIANT(500, "💎", "Olmos", 25, 10),
    MASTER(800, "👑", "Master", 28, 10);

    private final int minScore;
    private final String emoji;
    private final String displayName;
    private final int deltaWin;
    private final int deltaLoss;

    OctagonRank(int minScore, String emoji, String displayName, int deltaWin, int deltaLoss) {
        this.minScore = minScore;
        this.emoji = emoji;
        this.displayName = displayName;
        this.deltaWin = deltaWin;
        this.deltaLoss = deltaLoss;
    }

    public static OctagonRank fromElo(int elo) {
        OctagonRank[] all = values();
        for (int i = all.length - 1; i >= 0; i--) {
            if (elo >= all[i].minScore) return all[i];
        }
        return BRONZE;
    }
}
