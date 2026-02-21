package uz.pravaimtihon.enums;

import lombok.Getter;

@Getter
public enum CacheKey {
    QUESTIONS("questions", 3600),              // 1 hour
    PACKAGES("packages", 1800),                // 30 minutes
    USER_STATS("user_stats", 600),             // 10 minutes
    LEADERBOARD("leaderboard", 300),           // 5 minutes
    TRANSLATIONS("translations", 86400);       // 24 hours

    private final String prefix;
    private final long ttlSeconds;

    CacheKey(String prefix, long ttlSeconds) {
        this.prefix = prefix;
        this.ttlSeconds = ttlSeconds;
    }

    public String key(Object... params) {
        StringBuilder sb = new StringBuilder(prefix);
        for (Object param : params) {
            sb.append(":").append(param);
        }
        return sb.toString();
    }
}