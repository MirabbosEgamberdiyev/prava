package uz.pravaimtihon.octagon.enums;

import lombok.Getter;

@Getter
public enum OctagonRank {
    BRONZE(0, "🥉", "Bronza", 15, 15),
    SILVER(50, "🥈", "Kumush", 18, 15),
    GOLD(150, "🥇", "Oltin", 20, 12),
    BRILLIANT(300, "💎", "Brilliant", 25, 10);

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
        if (elo >= BRILLIANT.minScore) return BRILLIANT;
        if (elo >= GOLD.minScore) return GOLD;
        if (elo >= SILVER.minScore) return SILVER;
        return BRONZE;
    }
}
