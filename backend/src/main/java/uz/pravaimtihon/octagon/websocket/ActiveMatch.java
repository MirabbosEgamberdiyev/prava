package uz.pravaimtihon.octagon.websocket;

import lombok.Getter;
import lombok.Setter;
import uz.pravaimtihon.octagon.enums.OctagonGameType;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Getter
@Setter
public class ActiveMatch {

    /** submit_answer natijasi. */
    public enum AnswerOutcome { CORRECT, WRONG, REJECTED }

    private final UUID matchId;
    private final String player1Id;
    private final String player2Id;
    private final String player1Name;
    private final String player2Name;
    private final int player1Elo;
    private final int player2Elo;

    private OctagonSession p1Session;
    private OctagonSession p2Session;

    private final boolean isBotMatch;
    private OctagonGameBot bot;
    private final OctagonGameType gameType;

    private final List<Long> questionIds;
    private final Map<Long, Integer> correctOptions; // questionId -> correctOptionIndex (0..3)

    private int player1Score = 0;
    private int player2Score = 0;

    private final Map<Long, Integer> player1Answers = new ConcurrentHashMap<>();
    private final Map<Long, Integer> player2Answers = new ConcurrentHashMap<>();

    private final Map<Long, Instant> player1AnswerTimes = new ConcurrentHashMap<>();
    private final Map<Long, Instant> player2AnswerTimes = new ConcurrentHashMap<>();

    private volatile boolean player1Finished = false;
    private volatile boolean player2Finished = false;

    private Instant matchFoundAt;
    private volatile Instant startedAt;
    private volatile Instant deadlineAt;
    private volatile Instant endedAt;
    private volatile boolean isEnded = false;

    // Revenge/Rematch coordination
    private volatile boolean p1WantsRevenge = false;
    private volatile boolean p2WantsRevenge = false;
    private volatile boolean rematchCreated = false;

    /** Klientga yuboriladigan savollar (to'g'ri javobsiz). */
    private List<?> questionPayload = List.of();

    public ActiveMatch(UUID matchId,
                       OctagonSession p1Session,
                       OctagonSession p2Session,
                       String player2Id,
                       String player2Name,
                       int player2Elo,
                       boolean isBotMatch,
                       OctagonGameType gameType,
                       List<Long> questionIds,
                       Map<Long, Integer> correctOptions) {
        this.matchId = matchId;
        this.p1Session = p1Session;
        this.player1Id = p1Session.getUserId();
        this.player1Name = p1Session.getDisplayName();
        this.player1Elo = p1Session.getCurrentElo();

        this.p2Session = p2Session;
        this.player2Id = player2Id;
        this.player2Name = player2Name;
        this.player2Elo = player2Elo;

        this.isBotMatch = isBotMatch;
        this.gameType = gameType;
        this.questionIds = List.copyOf(questionIds);
        this.correctOptions = correctOptions;
        this.matchFoundAt = Instant.now();
    }

    public boolean isParticipant(String userId) {
        return userId != null && (userId.equals(player1Id) || userId.equals(player2Id));
    }

    /**
     * Javobni server tomonda qabul qiladi. Faqat shu jang savollari, faqat o'yin vaqti ichida
     * (match_started dan keyin, deadline'gacha) va har savolga bir marta.
     */
    public synchronized AnswerOutcome recordAnswer(String userId, Long questionId, int selectedIndex, Instant now) {
        if (isEnded || startedAt == null || questionId == null) return AnswerOutcome.REJECTED;
        if (deadlineAt != null && now.isAfter(deadlineAt)) return AnswerOutcome.REJECTED;
        if (!questionIds.contains(questionId) || selectedIndex < 0 || selectedIndex > 9) return AnswerOutcome.REJECTED;

        Integer correctIdx = correctOptions.get(questionId);
        boolean isCorrect = (correctIdx != null && correctIdx == selectedIndex);

        if (userId.equals(player1Id)) {
            if (player1Answers.containsKey(questionId)) return AnswerOutcome.REJECTED; // already answered
            player1Answers.put(questionId, selectedIndex);
            player1AnswerTimes.put(questionId, now);
            if (isCorrect) {
                player1Score++;
            }
            if (player1Answers.size() >= questionIds.size()) {
                player1Finished = true;
            }
        } else if (userId.equals(player2Id)) {
            if (player2Answers.containsKey(questionId)) return AnswerOutcome.REJECTED;
            player2Answers.put(questionId, selectedIndex);
            player2AnswerTimes.put(questionId, now);
            if (isCorrect) {
                player2Score++;
            }
            if (player2Answers.size() >= questionIds.size()) {
                player2Finished = true;
            }
        } else {
            return AnswerOutcome.REJECTED;
        }
        return isCorrect ? AnswerOutcome.CORRECT : AnswerOutcome.WRONG;
    }

    /** Jangni bir marta yakunlash huquqini oladi (ikki marta ELO hisoblanishining oldini oladi). */
    public synchronized boolean tryEnd(Instant now) {
        if (isEnded) return false;
        isEnded = true;
        endedAt = now;
        deadlineAt = now;
        return true;
    }

    /** Bir marta revansh yaratish huquqi. */
    public synchronized boolean tryClaimRematch() {
        if (rematchCreated) return false;
        rematchCreated = true;
        return true;
    }

    public boolean isBothFinished() {
        return player1Finished && player2Finished;
    }

    public OctagonSession getOpponentSession(String userId) {
        if (userId.equals(player1Id)) {
            return p2Session;
        } else if (userId.equals(player2Id)) {
            return p1Session;
        }
        return null;
    }
}
