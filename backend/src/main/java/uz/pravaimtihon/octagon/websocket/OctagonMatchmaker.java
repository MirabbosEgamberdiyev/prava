package uz.pravaimtihon.octagon.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class OctagonMatchmaker {

    private final OctagonService octagonService;
    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;

    private final List<OctagonSession> waitingQueue = new CopyOnWriteArrayList<>();
    private final Map<UUID, ActiveMatch> activeMatches = new ConcurrentHashMap<>();
    private final Map<String, OctagonSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, UUID> userOngoingMatchMap = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    @PostConstruct
    public void init() {
        // Run matchmaker loop every 1000ms
        scheduler.scheduleWithFixedDelay(this::matchmakingTick, 1000, 1000, TimeUnit.MILLISECONDS);
        // Run game timeout & disconnect grace-period cleaner every 3000ms
        scheduler.scheduleWithFixedDelay(this::cleanupAndTimeoutTick, 3000, 3000, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void destroy() {
        scheduler.shutdownNow();
    }

    public void registerSession(OctagonSession session) {
        activeSessions.put(session.getUserId(), session);

        // Check if user has an active reconnectable match
        UUID ongoingId = userOngoingMatchMap.get(session.getUserId());
        if (ongoingId != null) {
            ActiveMatch match = activeMatches.get(ongoingId);
            if (match != null && !match.isEnded()) {
                handleReconnect(session, match);
            }
        }
    }

    public void removeSession(String userId) {
        OctagonSession session = activeSessions.remove(userId);
        if (session != null) {
            leaveQueue(session);
            session.setDisconnectedAt(Instant.now());
        }
    }

    public void joinQueue(OctagonSession session, int userProgress, int currentElo) {
        if (session.getCurrentMatchId() != null) {
            ActiveMatch match = activeMatches.get(session.getCurrentMatchId());
            if (match != null && !match.isEnded()) {
                log.info("User {} already in active match {}", session.getUserId(), match.getMatchId());
                return;
            }
        }

        session.setCurrentElo(currentElo);
        session.setQueuedAt(Instant.now());

        if (!waitingQueue.contains(session)) {
            waitingQueue.add(session);
            log.info("User {} (ELO {}) joined Octagon queue. Queue size: {}",
                    session.getUserId(), currentElo, waitingQueue.size());
        }
    }

    public void leaveQueue(OctagonSession session) {
        waitingQueue.remove(session);
        session.setQueuedAt(null);
    }

    private void matchmakingTick() {
        try {
            if (waitingQueue.isEmpty()) return;

            Instant now = Instant.now();
            Set<OctagonSession> matched = new HashSet<>();

            for (int i = 0; i < waitingQueue.size(); i++) {
                OctagonSession p1 = waitingQueue.get(i);
                if (matched.contains(p1) || !p1.isOpen()) continue;

                long waitSec = Duration.between(p1.getQueuedAt(), now).getSeconds();

                // 1. Try finding live human opponent
                OctagonSession p2 = null;
                for (int j = i + 1; j < waitingQueue.size(); j++) {
                    OctagonSession candidate = waitingQueue.get(j);
                    if (matched.contains(candidate) || !candidate.isOpen()) continue;
                    if (candidate.getUserId().equals(p1.getUserId())) continue;

                    int eloDiff = Math.abs(p1.getCurrentElo() - candidate.getCurrentElo());

                    if (waitSec < 5 && eloDiff <= 30) {
                        p2 = candidate;
                        break;
                    } else if (waitSec >= 5 && waitSec < 15 && eloDiff <= 80) {
                        p2 = candidate;
                        break;
                    } else if (waitSec >= 15 && waitSec < 20) {
                        p2 = candidate;
                        break;
                    }
                }

                if (p2 != null) {
                    matched.add(p1);
                    matched.add(p2);
                    createMatch(p1, p2, false);
                } else if (waitSec >= 20) {
                    // 2. Timeout reached (> 20s): Spawn OctagonGameBot!
                    matched.add(p1);
                    createBotMatch(p1);
                }
            }

            waitingQueue.removeAll(matched);

        } catch (Exception e) {
            log.error("Error in matchmaking tick: {}", e.getMessage(), e);
        }
    }

    private void createMatch(OctagonSession p1, OctagonSession p2, boolean isBot) {
        UUID matchId = UUID.randomUUID();
        List<Long> questionIds = octagonService.getRandomQuestionIds(10);
        Map<Long, Integer> correctOptions = loadCorrectOptions(questionIds);

        ActiveMatch match = new ActiveMatch(
                matchId,
                p1,
                p2,
                p2.getUserId(),
                p2.getDisplayName(),
                p2.getCurrentElo(),
                isBot,
                OctagonGameType.RANKED_QUEUE,
                questionIds,
                correctOptions
        );

        p1.setCurrentMatchId(matchId);
        p2.setCurrentMatchId(matchId);
        userOngoingMatchMap.put(p1.getUserId(), matchId);
        userOngoingMatchMap.put(p2.getUserId(), matchId);
        activeMatches.put(matchId, match);

        log.info("Created match {} between {} and {}", matchId, p1.getUserId(), p2.getUserId());

        // Send match_found to both
        sendMatchFound(match, p1, p2.getUserId(), p2.getDisplayName(), p2.getCurrentElo(), p2.getRank().name().toLowerCase());
        sendMatchFound(match, p2, p1.getUserId(), p1.getDisplayName(), p1.getCurrentElo(), p1.getRank().name().toLowerCase());

        schedulePreloadAndCountdown(match);
    }

    private void createBotMatch(OctagonSession p1) {
        UUID matchId = UUID.randomUUID();
        List<Long> questionIds = octagonService.getRandomQuestionIds(10);
        Map<Long, Integer> correctOptions = loadCorrectOptions(questionIds);

        String botId = "bot_" + UUID.randomUUID().toString().substring(0, 6);
        String[] botNames = {"Sardor_Pro", "Dilshod_77", "Shaxzod_R", "Kamola_Avto", "Begzod_Turbo", "Malibu_Driver"};
        String botName = botNames[new Random().nextInt(botNames.length)];
        int botElo = Math.max(0, p1.getCurrentElo() + (new Random().nextInt(41) - 20));

        ActiveMatch match = new ActiveMatch(
                matchId,
                p1,
                null,
                botId,
                botName,
                botElo,
                true,
                OctagonGameType.BOT_TRAINING,
                questionIds,
                correctOptions
        );

        OctagonGameBot bot = new OctagonGameBot(botId, botName, botElo, match, scheduler,
                this::sendBotProgressToPlayer,
                () -> checkAndEndMatchIfFinished(match)
        );
        match.setBot(bot);

        p1.setCurrentMatchId(matchId);
        userOngoingMatchMap.put(p1.getUserId(), matchId);
        activeMatches.put(matchId, match);

        log.info("Created BOT match {} for user {} against bot {}", matchId, p1.getUserId(), botName);

        sendMatchFound(match, p1, botId, botName, botElo, "bronze");
        schedulePreloadAndCountdown(match);
    }

    private void sendMatchFound(ActiveMatch match, OctagonSession session,
                                String oppId, String oppName, int oppElo, String oppRank) {
        Map<String, Object> opp = new HashMap<>();
        opp.put("id", oppId);
        opp.put("name", oppName);
        opp.put("score", oppElo);
        opp.put("rank", oppRank);
        opp.put("avatar", "/images/default-avatar.webp");

        Map<String, Object> data = new HashMap<>();
        data.put("matchId", match.getMatchId().toString());
        data.put("opponent", opp);
        data.put("questionIds", match.getQuestionIds());
        data.put("preloadDurationMs", 8000);

        sendEvent(session, "match_found", data);
    }

    private void schedulePreloadAndCountdown(ActiveMatch match) {
        // At 8000ms: countdown 3
        scheduler.schedule(() -> sendBroadcastEvent(match, "countdown_tick", Map.of("count", 3)), 8000, TimeUnit.MILLISECONDS);
        // At 9000ms: countdown 2
        scheduler.schedule(() -> sendBroadcastEvent(match, "countdown_tick", Map.of("count", 2)), 9000, TimeUnit.MILLISECONDS);
        // At 10000ms: countdown 1
        scheduler.schedule(() -> sendBroadcastEvent(match, "countdown_tick", Map.of("count", 1)), 10000, TimeUnit.MILLISECONDS);

        // At 11000ms: match_started
        scheduler.schedule(() -> {
            match.setStartedAt(Instant.now());
            match.setDeadlineAt(Instant.now().plusSeconds(300));

            Map<String, Object> startData = Map.of(
                    "totalDurationSec", 300,
                    "startTime", System.currentTimeMillis()
            );
            sendBroadcastEvent(match, "match_started", startData);

            if (match.isBotMatch() && match.getBot() != null) {
                match.getBot().start();
            }
        }, 11000, TimeUnit.MILLISECONDS);
    }

    public void handleSubmitAnswer(OctagonSession session, UUID matchId, Long questionId, int selectedIndex, long clientTimestamp) {
        ActiveMatch match = activeMatches.get(matchId);
        if (match == null || match.isEnded()) return;

        // Anti-Cheat: check minimum latency (350ms)
        Instant now = Instant.now();
        if (match.getStartedAt() != null) {
            long msSinceStart = Duration.between(match.getStartedAt(), now).toMillis();
            if (msSinceStart < 350) {
                log.warn("Anti-cheat flag: answer submitted in {}ms (< 350ms) by {}", msSinceStart, session.getUserId());
            }
        }

        match.recordAnswer(session.getUserId(), questionId, selectedIndex, now);

        boolean isP1 = session.getUserId().equals(match.getPlayer1Id());
        int answeredCount = isP1 ? match.getPlayer1Answers().size() : match.getPlayer2Answers().size();
        int correctCount = isP1 ? match.getPlayer1Score() : match.getPlayer2Score();
        int questionIndex = match.getQuestionIds().indexOf(questionId);

        // Notify opponent about progress
        Map<String, Object> progress = Map.of(
                "questionIndex", questionIndex,
                "answeredCount", answeredCount,
                "correctCount", correctCount
        );

        OctagonSession oppSession = match.getOpponentSession(session.getUserId());
        if (oppSession != null) {
            sendEvent(oppSession, "opponent_progress", progress);
        }

        // Check if both finished
        checkAndEndMatchIfFinished(match);
    }

    private void sendBotProgressToPlayer(ActiveMatch match, String optionalEmoji) {
        int answered = match.getPlayer2Answers().size();
        int correct = match.getPlayer2Score();
        int lastQIdx = Math.min(match.getQuestionIds().size() - 1, Math.max(0, answered - 1));

        Map<String, Object> progress = Map.of(
                "questionIndex", lastQIdx,
                "answeredCount", answered,
                "correctCount", correct
        );

        sendEvent(match.getP1Session(), "opponent_progress", progress);

        if (optionalEmoji != null) {
            sendEvent(match.getP1Session(), "opponent_reaction", Map.of("emojiId", optionalEmoji));
        }
    }

    public void handleSendReaction(OctagonSession session, UUID matchId, String emojiId) {
        ActiveMatch match = activeMatches.get(matchId);
        if (match == null || match.isEnded()) return;

        // Rate-limit & anti-flood check: 3 reactions in 1.5s -> 8s mute
        Instant now = Instant.now();
        if (session.getReactionMutedUntil() != null && now.isBefore(session.getReactionMutedUntil())) {
            return;
        }

        if (Duration.between(session.getReactionWindowStart(), now).toMillis() > 1500) {
            session.setReactionWindowStart(now);
            session.setReactionCountInWindow(1);
        } else {
            session.setReactionCountInWindow(session.getReactionCountInWindow() + 1);
            if (session.getReactionCountInWindow() > 3) {
                session.setReactionMutedUntil(now.plusSeconds(8));
                return;
            }
        }

        OctagonSession opp = match.getOpponentSession(session.getUserId());
        if (opp != null) {
            sendEvent(opp, "opponent_reaction", Map.of("emojiId", emojiId));
        }
    }

    public void handleRequestRevenge(OctagonSession session, UUID matchId) {
        ActiveMatch match = activeMatches.get(matchId);
        if (match == null) return;

        if (session.getUserId().equals(match.getPlayer1Id())) {
            match.setP1WantsRevenge(true);
        } else if (session.getUserId().equals(match.getPlayer2Id())) {
            match.setP2WantsRevenge(true);
        }

        if (match.isBotMatch() && match.isP1WantsRevenge()) {
            // Instant revenge against bot
            createBotMatch(session);
        } else if (match.isP1WantsRevenge() && match.isP2WantsRevenge()) {
            // Both live players want revenge -> start instant rematch!
            OctagonSession p1 = match.getP1Session();
            OctagonSession p2 = match.getP2Session();
            if (p1 != null && p2 != null && p1.isOpen() && p2.isOpen()) {
                createMatch(p1, p2, false);
            }
        }
    }

    private synchronized void checkAndEndMatchIfFinished(ActiveMatch match) {
        if (match.isEnded()) return;

        if (match.isBothFinished()) {
            finalizeMatch(match);
        }
    }

    private void finalizeMatch(ActiveMatch match) {
        if (match.isEnded()) return;
        match.setEnded(true);
        match.setDeadlineAt(Instant.now());

        if (match.getBot() != null) {
            match.getBot().stop();
        }

        int durationSec = match.getStartedAt() != null
                ? (int) Duration.between(match.getStartedAt(), Instant.now()).getSeconds()
                : 0;

        OctagonMatch persisted = octagonService.recordMatchResult(
                match.getMatchId(),
                match.getPlayer1Id(),
                match.getPlayer2Id(),
                match.getPlayer1Score(),
                match.getPlayer2Score(),
                match.getQuestionIds(),
                durationSec,
                match.getGameType()
        );

        userOngoingMatchMap.remove(match.getPlayer1Id());
        userOngoingMatchMap.remove(match.getPlayer2Id());

        // Send personalized match_ended to P1
        if (match.getP1Session() != null) {
            Map<String, Object> p1Scores = Map.of(
                    "me", match.getPlayer1Score(),
                    "opponent", match.getPlayer2Score()
            );
            Map<String, Object> p1Data = Map.of(
                    "winnerId", persisted.getWinnerId() != null ? persisted.getWinnerId() : "",
                    "isDraw", persisted.getIsDraw(),
                    "myDeltaElo", persisted.getP1EloChange(),
                    "opponentDeltaElo", persisted.getP2EloChange(),
                    "finalScores", p1Scores
            );
            sendEvent(match.getP1Session(), "match_ended", p1Data);
        }

        // Send personalized match_ended to P2 (if human)
        if (match.getP2Session() != null) {
            Map<String, Object> p2Scores = Map.of(
                    "me", match.getPlayer2Score(),
                    "opponent", match.getPlayer1Score()
            );
            Map<String, Object> p2Data = Map.of(
                    "winnerId", persisted.getWinnerId() != null ? persisted.getWinnerId() : "",
                    "isDraw", persisted.getIsDraw(),
                    "myDeltaElo", persisted.getP2EloChange(),
                    "opponentDeltaElo", persisted.getP1EloChange(),
                    "finalScores", p2Scores
            );
            sendEvent(match.getP2Session(), "match_ended", p2Data);
        }
    }

    private void handleReconnect(OctagonSession session, ActiveMatch match) {
        session.setCurrentMatchId(match.getMatchId());
        boolean isP1 = session.getUserId().equals(match.getPlayer1Id());
        if (isP1) {
            match.setP1Session(session);
        } else {
            match.setP2Session(session);
        }

        int answeredCount = isP1 ? match.getPlayer1Answers().size() : match.getPlayer2Answers().size();
        int oppAnswered = isP1 ? match.getPlayer2Answers().size() : match.getPlayer1Answers().size();
        int oppScore = isP1 ? match.getPlayer2Score() : match.getPlayer1Score();

        long remainingSec = match.getDeadlineAt() != null
                ? Math.max(0, Duration.between(Instant.now(), match.getDeadlineAt()).getSeconds())
                : 300;

        Map<String, Object> reconnectData = new HashMap<>();
        reconnectData.put("matchId", match.getMatchId().toString());
        reconnectData.put("questionIndex", answeredCount);
        reconnectData.put("myAnswers", isP1 ? match.getPlayer1Answers() : match.getPlayer2Answers());
        reconnectData.put("opponentProgress", Map.of("answeredCount", oppAnswered, "correctCount", oppScore));
        reconnectData.put("remainingTimeSec", remainingSec);

        sendEvent(session, "game_reconnect", reconnectData);
    }

    private void cleanupAndTimeoutTick() {
        Instant now = Instant.now();

        // 1. Check match timeout (exceeded 300s)
        for (ActiveMatch match : activeMatches.values()) {
            if (!match.isEnded() && match.getDeadlineAt() != null && now.isAfter(match.getDeadlineAt())) {
                log.info("Match {} timed out after 300 seconds. Finalizing...", match.getMatchId());
                finalizeMatch(match);
            }
        }

        // 2. Check disconnect grace period (45s)
        for (ActiveMatch match : activeMatches.values()) {
            if (match.isEnded()) continue;

            if (match.getP1Session() != null && match.getP1Session().getDisconnectedAt() != null) {
                long dSec = Duration.between(match.getP1Session().getDisconnectedAt(), now).getSeconds();
                if (dSec > 45) {
                    log.info("Player 1 {} abandoned match {}", match.getPlayer1Id(), match.getMatchId());
                    match.setPlayer1Score(0);
                    finalizeMatch(match);
                }
            }

            if (match.getP2Session() != null && match.getP2Session().getDisconnectedAt() != null) {
                long dSec = Duration.between(match.getP2Session().getDisconnectedAt(), now).getSeconds();
                if (dSec > 45) {
                    log.info("Player 2 {} abandoned match {}", match.getPlayer2Id(), match.getMatchId());
                    match.setPlayer2Score(0);
                    finalizeMatch(match);
                }
            }
        }
    }

    private Map<Long, Integer> loadCorrectOptions(List<Long> qIds) {
        Map<Long, Integer> map = new HashMap<>();
        try {
            List<Question> questions = questionRepository.findAllById(qIds);
            for (Question q : questions) {
                map.put(q.getId(), q.getCorrectAnswerIndex() != null ? q.getCorrectAnswerIndex() : 0);
            }
        } catch (Exception e) {
            log.error("Failed to load correct options for questions {}: {}", qIds, e.getMessage());
        }
        for (Long id : qIds) {
            map.putIfAbsent(id, 0);
        }
        return map;
    }

    private void sendBroadcastEvent(ActiveMatch match, String event, Map<String, Object> data) {
        if (match.getP1Session() != null) {
            sendEvent(match.getP1Session(), event, data);
        }
        if (match.getP2Session() != null) {
            sendEvent(match.getP2Session(), event, data);
        }
    }

    private void sendEvent(OctagonSession session, String event, Map<String, Object> data) {
        if (session == null || !session.isOpen()) return;
        try {
            Map<String, Object> msg = new HashMap<>();
            msg.put("event", event);
            msg.put("data", data);
            String json = objectMapper.writeValueAsString(msg);
            session.send(json);
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket event {}: {}", event, e.getMessage());
        }
    }
}
