package uz.pravaimtihon.octagon.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.octagon.dto.OctagonDtos.*;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

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

    // Direct duel challenges & group rooms
    private final Map<UUID, PendingChallenge> pendingChallenges = new ConcurrentHashMap<>();
    private final Map<String, GroupRoom> groupRooms = new ConcurrentHashMap<>();
    private final Map<String, String> userRoomMap = new ConcurrentHashMap<>();

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
            handleLeaveRoom(session);
            session.setDisconnectedAt(Instant.now());
        }
    }

    public boolean isUserOnline(String userId) {
        if (userId == null) return false;
        OctagonSession s = activeSessions.get(userId);
        return s != null && s.isOpen();
    }

    public String getUserStatus(String userId) {
        if (userId == null) return "OFFLINE";
        if (userOngoingMatchMap.containsKey(userId)) {
            return "IN_MATCH";
        }
        if (userRoomMap.containsKey(userId)) {
            return "IN_ROOM";
        }
        for (OctagonSession s : waitingQueue) {
            if (s.getUserId().equals(userId)) {
                return "IN_QUEUE";
            }
        }
        if (isUserOnline(userId)) {
            return "AVAILABLE";
        }
        return "OFFLINE";
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
        createMatch(p1, p2, isBot, OctagonGameType.RANKED_QUEUE);
    }

    public void createDirectMatch(OctagonSession p1, OctagonSession p2, OctagonGameType gameType) {
        createMatch(p1, p2, false, gameType);
    }

    private void createMatch(OctagonSession p1, OctagonSession p2, boolean isBot, OctagonGameType gameType) {
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
                gameType,
                questionIds,
                correctOptions
        );

        p1.setCurrentMatchId(matchId);
        p2.setCurrentMatchId(matchId);
        userOngoingMatchMap.put(p1.getUserId(), matchId);
        userOngoingMatchMap.put(p2.getUserId(), matchId);
        activeMatches.put(matchId, match);

        log.info("Created match {} ({}) between {} and {}", matchId, gameType, p1.getUserId(), p2.getUserId());

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

        ActiveMatch match = activeMatches.get(matchId);
        if (match == null || match.isEnded()) return;

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

        // 3. Check group room timeouts (exceeded 300s)
        for (GroupRoom room : groupRooms.values()) {
            if ("PLAYING".equals(room.getStatus()) && !room.isEnded() && room.getDeadlineAt() != null && now.isAfter(room.getDeadlineAt())) {
                log.info("Group room {} timed out. Finalizing...", room.getRoomCode());
                finalizeGroupRoom(room);
            }
        }
    }

    // ----------------------------------------------------
    // FRIEND DUEL CHALLENGES
    // ----------------------------------------------------
    public void handleSendChallenge(OctagonSession challenger, String targetUserId) {
        if (targetUserId == null || targetUserId.isBlank()) return;

        if (targetUserId.equals(challenger.getUserId())) {
            sendEvent(challenger, "challenge_error", Map.of(
                    "code", "SELF_CHALLENGE",
                    "message", "O'zingizga taklif yubora olmaysiz"
            ));
            return;
        }

        OctagonSession target = activeSessions.get(targetUserId);
        if (target == null || !target.isOpen()) {
            sendEvent(challenger, "challenge_error", Map.of(
                    "code", "PLAYER_OFFLINE",
                    "message", "Foydalanuvchi hozir tarmoqda emas"
            ));
            return;
        }

        String status = getUserStatus(targetUserId);
        if ("IN_MATCH".equals(status)) {
            sendEvent(challenger, "challenge_error", Map.of(
                    "code", "PLAYER_IN_MATCH",
                    "message", "Foydalanuvchi hozir jangda"
            ));
            return;
        }
        if ("IN_QUEUE".equals(status)) {
            sendEvent(challenger, "challenge_error", Map.of(
                    "code", "PLAYER_IN_QUEUE",
                    "message", "Foydalanuvchi qidiruvda"
            ));
            return;
        }

        UUID challengeId = UUID.randomUUID();
        PendingChallenge pc = new PendingChallenge(
                challengeId,
                challenger.getUserId(),
                challenger.getDisplayName(),
                challenger.getCurrentElo(),
                challenger.getRank(),
                targetUserId
        );
        pendingChallenges.put(challengeId, pc);

        sendEvent(challenger, "challenge_sent", Map.of(
                "challengeId", challengeId.toString(),
                "targetUserId", targetUserId
        ));

        sendEvent(target, "challenge_received", Map.of(
                "challengeId", challengeId.toString(),
                "challenger", Map.of(
                        "userId", challenger.getUserId(),
                        "displayName", challenger.getDisplayName(),
                        "eloRating", challenger.getCurrentElo(),
                        "rank", challenger.getRank() != null ? challenger.getRank().name().toLowerCase() : "bronze",
                        "rankEmoji", challenger.getRank() != null ? challenger.getRank().getEmoji() : "🥉"
                ),
                "expiresInSec", 30
        ));

        scheduler.schedule(() -> {
            PendingChallenge exp = pendingChallenges.remove(challengeId);
            if (exp != null) {
                OctagonSession ch = activeSessions.get(exp.challengerId);
                if (ch != null) {
                    sendEvent(ch, "challenge_error", Map.of("code", "CHALLENGE_TIMEOUT", "message", "Taklifga javob berilmadi"));
                }
            }
        }, 30, TimeUnit.SECONDS);
    }

    public void handleAcceptChallenge(OctagonSession targetSession, UUID challengeId) {
        PendingChallenge pc = pendingChallenges.remove(challengeId);
        if (pc == null || pc.isExpired()) {
            sendEvent(targetSession, "challenge_error", Map.of(
                    "code", "CHALLENGE_EXPIRED",
                    "message", "Taklif muddati tugagan"
            ));
            return;
        }

        OctagonSession challengerSession = activeSessions.get(pc.challengerId);
        if (challengerSession == null || !challengerSession.isOpen() || "IN_MATCH".equals(getUserStatus(pc.challengerId))) {
            sendEvent(targetSession, "challenge_error", Map.of(
                    "code", "CHALLENGER_UNAVAILABLE",
                    "message", "Raqib hozir mavjud emas"
            ));
            return;
        }

        log.info("Direct duel accepted: {} vs {}", pc.challengerId, targetSession.getUserId());
        createDirectMatch(challengerSession, targetSession, OctagonGameType.DUEL_FRIEND);
    }

    public void handleRejectChallenge(OctagonSession targetSession, UUID challengeId) {
        PendingChallenge pc = pendingChallenges.remove(challengeId);
        if (pc != null) {
            OctagonSession ch = activeSessions.get(pc.challengerId);
            if (ch != null) {
                sendEvent(ch, "challenge_rejected", Map.of(
                        "challengeId", challengeId.toString(),
                        "byUserId", targetSession.getUserId()
                ));
            }
        }
    }

    // ----------------------------------------------------
    // GROUP ROOMS (GURUHLI BAHS)
    // ----------------------------------------------------
    public void handleCreateRoom(OctagonSession session, int maxPlayers, boolean isPrivate) {
        handleLeaveRoom(session);

        String roomCode = generateRoomCode();
        GroupRoom room = new GroupRoom(roomCode, session.getUserId(), maxPlayers, isPrivate);

        OctagonProfile profile = octagonService.getOrCreateProfile(session.getUserId());
        GroupRoomMember host = new GroupRoomMember(
                session.getUserId(),
                session.getDisplayName(),
                "/images/default-avatar.webp",
                profile.getEloRating(),
                profile.getRank() != null ? profile.getRank().getEmoji() : "🥉",
                true
        );
        room.getMembers().put(session.getUserId(), host);
        groupRooms.put(roomCode, room);
        userRoomMap.put(session.getUserId(), roomCode);

        sendEvent(session, "room_created", Map.of("room", toRoomDto(room)));
        broadcastRoomUpdated(room);
    }

    public void handleJoinRoom(OctagonSession session, String roomCode) {
        if (roomCode == null || roomCode.isBlank()) return;
        String code = roomCode.trim().toUpperCase();
        GroupRoom room = groupRooms.get(code);

        if (room == null) {
            sendEvent(session, "room_error", Map.of("code", "ROOM_NOT_FOUND", "message", "Xona topilmadi"));
            return;
        }

        if (!"WAITING".equals(room.getStatus())) {
            sendEvent(session, "room_error", Map.of("code", "ROOM_ALREADY_STARTED", "message", "O'yin allaqachon boshlangan"));
            return;
        }

        if (room.getMembers().size() >= room.getMaxPlayers() && !room.getMembers().containsKey(session.getUserId())) {
            sendEvent(session, "room_error", Map.of("code", "ROOM_FULL", "message", "Xona to'la"));
            return;
        }

        handleLeaveRoom(session);

        OctagonProfile profile = octagonService.getOrCreateProfile(session.getUserId());
        GroupRoomMember member = new GroupRoomMember(
                session.getUserId(),
                session.getDisplayName(),
                "/images/default-avatar.webp",
                profile.getEloRating(),
                profile.getRank() != null ? profile.getRank().getEmoji() : "🥉",
                false
        );
        room.getMembers().put(session.getUserId(), member);
        userRoomMap.put(session.getUserId(), code);

        sendEvent(session, "room_joined", Map.of("room", toRoomDto(room)));
        broadcastRoomUpdated(room);
    }

    public void handleLeaveRoom(OctagonSession session) {
        String code = userRoomMap.remove(session.getUserId());
        if (code == null) return;

        GroupRoom room = groupRooms.get(code);
        if (room == null) return;

        room.getMembers().remove(session.getUserId());
        sendEvent(session, "room_left", Map.of("roomCode", code));

        if (room.getMembers().isEmpty()) {
            groupRooms.remove(code);
        } else {
            if (session.getUserId().equals(room.getHostUserId())) {
                GroupRoomMember nextHost = room.getMembers().values().iterator().next();
                nextHost.setHost(true);
                nextHost.setReady(true);
                room.setHostUserId(nextHost.getUserId());
            }
            broadcastRoomUpdated(room);
        }
    }

    public void handleToggleReady(OctagonSession session, boolean isReady) {
        String code = userRoomMap.get(session.getUserId());
        if (code == null) return;

        GroupRoom room = groupRooms.get(code);
        if (room == null) return;

        GroupRoomMember member = room.getMembers().get(session.getUserId());
        if (member != null && !member.isHost()) {
            member.setReady(isReady);
            broadcastRoomUpdated(room);
        }
    }

    public void handleStartRoomGame(OctagonSession session) {
        String code = userRoomMap.get(session.getUserId());
        if (code == null) return;

        GroupRoom room = groupRooms.get(code);
        if (room == null) return;

        if (!session.getUserId().equals(room.getHostUserId())) {
            sendEvent(session, "room_error", Map.of("code", "NOT_HOST", "message", "Faqat xona egasi o'yinni boshlay oladi"));
            return;
        }

        if (room.getMembers().size() < 2) {
            sendEvent(session, "room_error", Map.of("code", "NEED_MORE_PLAYERS", "message", "O'yinni boshlash uchun kamida 2 nafar o'yinchi kerak"));
            return;
        }

        room.setStatus("COUNTDOWN");
        List<Long> questionIds = octagonService.getRandomQuestionIds(10);
        room.setQuestionIds(questionIds);
        room.setCorrectOptions(loadCorrectOptions(questionIds));

        broadcastRoomEvent(room, "room_game_countdown", Map.of("count", 3));
        scheduler.schedule(() -> broadcastRoomEvent(room, "room_game_countdown", Map.of("count", 2)), 1000, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> broadcastRoomEvent(room, "room_game_countdown", Map.of("count", 1)), 2000, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> {
            room.setStatus("PLAYING");
            room.setStartedAt(Instant.now());
            room.setDeadlineAt(Instant.now().plusSeconds(300));
            broadcastRoomEvent(room, "room_game_started", Map.of(
                    "roomCode", room.getRoomCode(),
                    "questionIds", room.getQuestionIds(),
                    "totalDurationSec", 300,
                    "startTime", System.currentTimeMillis()
            ));
        }, 3000, TimeUnit.MILLISECONDS);
    }

    public void handleSubmitRoomAnswer(OctagonSession session, Long questionId, int selectedIndex, long clientTimestamp) {
        String code = userRoomMap.get(session.getUserId());
        if (code == null) return;

        GroupRoom room = groupRooms.get(code);
        if (room == null || !"PLAYING".equals(room.getStatus()) || room.isEnded()) return;

        GroupRoomMember member = room.getMembers().get(session.getUserId());
        if (member == null || member.getAnswers().containsKey(questionId)) return;

        member.getAnswers().put(questionId, selectedIndex);
        member.getAnswerTimes().put(questionId, Instant.now());
        Integer correct = room.getCorrectOptions().get(questionId);
        boolean isCorrect = (correct != null && correct == selectedIndex);
        if (isCorrect) {
            member.setScore(member.getScore() + 1);
        }

        int answeredCount = member.getAnswers().size();
        int questionIndex = room.getQuestionIds().indexOf(questionId);
        if (answeredCount >= room.getQuestionIds().size()) {
            member.setFinished(true);
        }

        broadcastRoomEvent(room, "group_progress", Map.of(
                "userId", member.getUserId(),
                "displayName", member.getDisplayName(),
                "questionIndex", questionIndex,
                "answeredCount", answeredCount,
                "score", member.getScore()
        ));

        boolean allFinished = room.getMembers().values().stream().allMatch(GroupRoomMember::isFinished);
        if (allFinished) {
            finalizeGroupRoom(room);
        }
    }

    private synchronized void finalizeGroupRoom(GroupRoom room) {
        if (room.isEnded()) return;
        room.setEnded(true);
        room.setStatus("FINISHED");

        List<Map<String, Object>> standings = room.getMembers().values().stream()
                .sorted((m1, m2) -> Integer.compare(m2.getScore(), m1.getScore()))
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", m.getUserId());
                    map.put("displayName", m.getDisplayName());
                    map.put("avatarUrl", m.getAvatarUrl());
                    map.put("score", m.getScore());
                    map.put("answeredCount", m.getAnswers().size());
                    return map;
                })
                .collect(Collectors.toList());

        broadcastRoomEvent(room, "group_match_ended", Map.of(
                "roomCode", room.getRoomCode(),
                "standings", standings
        ));
    }

    public Optional<GroupRoomDto> getRoomDto(String roomCode) {
        if (roomCode == null) return Optional.empty();
        GroupRoom room = groupRooms.get(roomCode.trim().toUpperCase());
        return room != null ? Optional.of(toRoomDto(room)) : Optional.empty();
    }

    public GroupRoomDto toRoomDto(GroupRoom room) {
        String hostName = octagonService.resolveDisplayName(room.getHostUserId());
        List<GroupRoomMemberDto> memberDtos = room.getMembers().values().stream()
                .map(m -> GroupRoomMemberDto.builder()
                        .userId(m.getUserId())
                        .displayName(m.getDisplayName())
                        .avatarUrl(m.getAvatarUrl())
                        .eloRating(m.getEloRating())
                        .rankEmoji(m.getRankEmoji())
                        .isHost(m.isHost())
                        .isReady(m.isReady())
                        .currentScore(m.getScore())
                        .answeredCount(m.getAnswers().size())
                        .build())
                .collect(Collectors.toList());

        return GroupRoomDto.builder()
                .roomCode(room.getRoomCode())
                .hostId(room.getHostUserId())
                .hostName(hostName)
                .maxPlayers(room.getMaxPlayers())
                .isPrivate(room.isPrivate())
                .status(room.getStatus())
                .members(memberDtos)
                .createdAt(room.getCreatedAt().toString())
                .build();
    }

    private void broadcastRoomUpdated(GroupRoom room) {
        GroupRoomDto dto = toRoomDto(room);
        broadcastRoomEvent(room, "room_updated", Map.of("room", dto));
    }

    private void broadcastRoomEvent(GroupRoom room, String event, Map<String, Object> data) {
        for (String memberId : room.getMembers().keySet()) {
            OctagonSession s = activeSessions.get(memberId);
            if (s != null && s.isOpen()) {
                sendEvent(s, event, data);
            }
        }
    }

    private String generateRoomCode() {
        return "OCT-" + (1000 + new Random().nextInt(9000));
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

    // ----------------------------------------------------
    // INNER CLASSES FOR CHALLENGES & ROOMS
    // ----------------------------------------------------
    public static class PendingChallenge {
        private final UUID challengeId;
        private final String challengerId;
        private final String challengerName;
        private final int challengerElo;
        private final OctagonRank challengerRank;
        private final String targetUserId;
        private final Instant createdAt = Instant.now();
        private final Instant expiresAt = Instant.now().plusSeconds(30);

        public PendingChallenge(UUID challengeId, String challengerId, String challengerName,
                                int challengerElo, OctagonRank challengerRank, String targetUserId) {
            this.challengeId = challengeId;
            this.challengerId = challengerId;
            this.challengerName = challengerName;
            this.challengerElo = challengerElo;
            this.challengerRank = challengerRank;
            this.targetUserId = targetUserId;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    @Getter
    @Setter
    public static class GroupRoomMember {
        private final String userId;
        private final String displayName;
        private final String avatarUrl;
        private final int eloRating;
        private final String rankEmoji;
        private volatile boolean isHost;
        private volatile boolean isReady;
        private volatile int score = 0;
        private final Map<Long, Integer> answers = new ConcurrentHashMap<>();
        private final Map<Long, Instant> answerTimes = new ConcurrentHashMap<>();
        private volatile boolean finished = false;

        public GroupRoomMember(String userId, String displayName, String avatarUrl, int eloRating, String rankEmoji, boolean isHost) {
            this.userId = userId;
            this.displayName = displayName;
            this.avatarUrl = avatarUrl != null ? avatarUrl : "/images/default-avatar.webp";
            this.eloRating = eloRating;
            this.rankEmoji = rankEmoji != null ? rankEmoji : "🥉";
            this.isHost = isHost;
            this.isReady = isHost;
        }
    }

    @Getter
    @Setter
    public static class GroupRoom {
        private final String roomCode;
        private volatile String hostUserId;
        private final int maxPlayers;
        private final boolean isPrivate;
        private volatile String status = "WAITING";
        private final Map<String, GroupRoomMember> members = new ConcurrentHashMap<>();
        private final Instant createdAt = Instant.now();
        private Instant startedAt;
        private Instant deadlineAt;
        private List<Long> questionIds = new ArrayList<>();
        private Map<Long, Integer> correctOptions = new HashMap<>();
        private volatile boolean isEnded = false;

        public GroupRoom(String roomCode, String hostUserId, int maxPlayers, boolean isPrivate) {
            this.roomCode = roomCode;
            this.hostUserId = hostUserId;
            this.maxPlayers = Math.max(2, Math.min(8, maxPlayers));
            this.isPrivate = isPrivate;
        }
    }
}
