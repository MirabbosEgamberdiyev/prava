package uz.pravaimtihon.octagon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.octagon.enums.OctagonRank;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class OctagonDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketResponse {
        private String ticket;
        private int expiresInSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsResponse {
        private String userId;
        private String displayName;
        private int eloRating;
        private OctagonRank rank;
        private String rankEmoji;
        private String rankName;
        private int wins;
        private int losses;
        private int draws;
        private int winStreak;
        private int maxWinStreak;
        private int totalMatches;
        private double winRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private int position;
        private String userId;
        private String displayName;
        private int eloRating;
        private OctagonRank rank;
        private String rankEmoji;
        private int wins;
        private int totalMatches;
        private double winRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchHistoryEntry {
        private UUID matchId;
        private String opponentId;
        private String opponentName;
        private int myScore;
        private int opponentScore;
        private String result; // "WIN", "LOSS", "DRAW"
        private int deltaElo;
        private int durationSeconds;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChallengeResponse {
        private UUID challengeId;
        private String inviteCode;
        private String inviteUrl;
        private String challengerId;
        private String challengerName;
        private LocalDateTime expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionOptionDto {
        private int index;
        private String textUzl;
        private String textUzc;
        private String textRu;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDto {
        private Long id;
        private String textUzl;
        private String textUzc;
        private String textRu;
        private String imageUrl;
        private List<QuestionOptionDto> options;
        private String explanationUzl;
        private String explanationUzc;
        private String explanationRu;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSearchResult {
        private String userId;
        private String displayName;
        private String avatarUrl;
        private int eloRating;
        private OctagonRank rank;
        private String rankEmoji;
        private String rankName;
        private boolean isOnline;
        private String status; // "AVAILABLE", "IN_MATCH", "IN_QUEUE"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupRoomMemberDto {
        private String userId;
        private String displayName;
        private String avatarUrl;
        private int eloRating;
        private String rankEmoji;
        private boolean isHost;
        private boolean isReady;
        private int currentScore;
        private int answeredCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupRoomDto {
        private String roomCode;
        private String hostId;
        private String hostName;
        private int maxPlayers;
        private boolean isPrivate;
        private String status; // "WAITING", "COUNTDOWN", "PLAYING", "FINISHED"
        private List<GroupRoomMemberDto> members;
        private String createdAt;
    }
}

