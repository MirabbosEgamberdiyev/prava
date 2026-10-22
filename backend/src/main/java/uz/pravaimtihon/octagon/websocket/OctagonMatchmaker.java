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
import uz.pravaimtihon.octagon.entity.OctagonChallenge;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.service.OctagonBotPersonas;
import uz.pravaimtihon.octagon.service.OctagonCodeGuard;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/**
 * Oktagon real-time o'yin mexanizmi (navbat, 1v1 jang, bot, do'st chaqiruvi, guruh xonalari).
 *
 * Ishonch manbai — server: ELO profildan olinadi (klient yuborgan qiymat e'tiborga olinmaydi), javoblar
 * faqat shu jang savollari uchun va faqat o'yin vaqtida qabul qilinadi, jang natijasi bir marta yoziladi.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OctagonMatchmaker {

    static final int QUESTIONS_PER_MATCH = 10;
    static final int MATCH_DURATION_SEC = 300;
    static final long PRELOAD_MS = 8000;
    static final long DISCONNECT_GRACE_SEC = 45;
    /** Tugagan jang/xona revansh va natija uchun shuncha vaqt xotirada turadi, keyin o'chiriladi. */
    static final long ENDED_RETENTION_SEC = 120;
    static final int MAX_CHALLENGES_PER_MINUTE = 5;
    static final int CHALLENGE_TTL_SEC = 30;
    /** Qidiruv: 3 s gacha ±30 ELO, 6 s gacha ±80, keyin istalgan inson; 7 s da inson bo'lmasa — bot. */
    static final long ELO_STRICT_SEC = 3;
    static final long ELO_WIDE_SEC = 6;
    static final long BOT_FALLBACK_SEC = 7;
    /** Radar uchun navbat holati (real son: qidirayotganlar va onlayn o'yinchilar) shu oraliqda yuboriladi. */
    static final long QUEUE_STATUS_INTERVAL_MS = 2000;
    /** Guruh xonasi kodi ham 4 raqamli (1000–9999); faol xonalar orasida unikal. */
    static final int ROOM_CODE_ATTEMPTS = 25;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OctagonService octagonService;
    private final QuestionRepository questionRepository;
    private final ObjectMapper objectMapper;
    private final OctagonCodeGuard codeGuard;

    private final List<OctagonSession> waitingQueue = new CopyOnWriteArrayList<>();
    private final Map<UUID, ActiveMatch> activeMatches = new ConcurrentHashMap<>();
    private final Map<String, OctagonSession> activeSessions = new ConcurrentHashMap<>();
    private final Map<String, UUID> userOngoingMatchMap = new ConcurrentHashMap<>();

    // Direct duel challenges & group rooms
    private final Map<UUID, PendingChallenge> pendingChallenges = new ConcurrentHashMap<>();
    private final Map<String, GroupRoom> groupRooms = new ConcurrentHashMap<>();
    private final Map<String, String> userRoomMap = new ConcurrentHashMap<>();

    /** Navbat va jang yaratish bitta qulf ostida — bir o'yinchi bir vaqtda ikki jangga tushmasin. */
    private final Object matchLock = new Object();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    @PostConstruct
    public void init() {
        scheduler.scheduleWithFixedDelay(this::matchmakingTick, 1000, 1000, TimeUnit.MILLISECONDS);
        scheduler.scheduleWithFixedDelay(this::cleanupAndTimeoutTick, 3000, 3000, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void destroy() {
        scheduler.shutdownNow();
    }

    // ----------------------------------------------------
    // SESSIONS
    // ----------------------------------------------------

    public void registerSession(OctagonSession session) {
        applyProfile(session);
        OctagonSession previous = activeSessions.put(session.getUserId(), session);
        if (previous != null && previous != session) {
            // Eski ulanish (boshqa tab/qurilma) navbatda qolib ketmasin
            waitingQueue.remove(previous);
        }

        UUID ongoingId = userOngoingMatchMap.get(session.getUserId());
        if (ongoingId != null) {
            ActiveMatch match = activeMatches.get(ongoingId);
            if (match != null && !match.isEnded()) {
                handleReconnect(session, match);
            }
        }
    }

    /** ELO va ligani bazadagi profildan oladi. */
    private void applyProfile(OctagonSession session) {
        try {
            OctagonProfile profile = octagonService.getProfileSnapshot(session.getUserId());
            if (profile != null) {
                session.setCurrentElo(profile.getEloRating());
                session.setRank(OctagonRank.fromElo(profile.getEloRating()));
            }
            session.setAvatarUrl(octagonService.resolveAvatarUrl(session.getUserId()));
        } catch (Exception e) {
            log.warn("Failed to load Octagon profile for {}: {}", session.getUserId(), e.getMessage());
        }
    }

    /** Eski API (testlar uchun): foydalanuvchining joriy sessiyasini yopilgan deb belgilaydi. */
    public void removeSession(String userId) {
        OctagonSession session = activeSessions.get(userId);
        if (session != null) removeSession(session);
    }

    /**
     * Ulanish yopildi. Foydalanuvchi allaqachon YANGI ulanish bilan qaytgan bo'lsa (reconnect eski socket
     * yopilishidan oldin kelgan), yangi sessiya o'chirilmaydi.
     */
    public void removeSession(OctagonSession session) {
        session.setDisconnectedAt(Instant.now());
        boolean wasCurrent = activeSessions.remove(session.getUserId(), session);
        waitingQueue.remove(session);
        session.setQueuedAt(null);
        if (wasCurrent) {
            handleLeaveRoom(session);
        }
    }

    /**
     * Qidirayotgan o'yinchilarga radar uchun haqiqiy ma'lumot: navbatda yana nechta odam bor va hozir
     * Oktagon'da nechta o'yinchi onlayn (kimligi oshkor qilinmaydi). Har o'yinchiga ko'pi bilan 2 s da bir marta.
     */
    void broadcastQueueStatus(Instant now) {
        if (waitingQueue.isEmpty()) return;
        long online = activeSessions.values().stream().filter(OctagonSession::isOpen).count();
        int searching = Math.max(0, waitingQueue.size() - 1);
        for (OctagonSession s : waitingQueue) {
            Instant last = s.getLastQueueStatusAt();
            if (last != null && Duration.between(last, now).toMillis() < QUEUE_STATUS_INTERVAL_MS) continue;
            s.setLastQueueStatusAt(now);
            sendEvent(s, "queue_status", Map.of("searching", searching, "online", online));
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

    private boolean hasLiveMatch(String userId) {
        UUID id = userOngoingMatchMap.get(userId);
        if (id == null) return false;
        ActiveMatch m = activeMatches.get(id);
        return m != null && !m.isEnded();
    }

    // ----------------------------------------------------
    // QUEUE
    // ----------------------------------------------------

    /**
     * Navbatga kirish. {@code userProgress}/{@code clientElo} eski klientlar bilan moslik uchun qabul qilinadi,
     * lekin juftlash uchun faqat serverdagi ELO ishlatiladi.
     */
    public void joinQueue(OctagonSession session, int userProgress, int clientElo) {
        synchronized (matchLock) {
            if (hasLiveMatch(session.getUserId())) {
                log.info("User {} already in an active match — join_queue ignored", session.getUserId());
                return;
            }
            if (userRoomMap.containsKey(session.getUserId())) {
                handleLeaveRoom(session);
            }
            applyProfile(session);
            session.setQueuedAt(Instant.now());

            // Bir foydalanuvchining eski sessiyasi navbatda qolgan bo'lsa — almashtiramiz
            waitingQueue.removeIf(s -> s != session && s.getUserId().equals(session.getUserId()));
            if (!waitingQueue.contains(session)) {
                waitingQueue.add(session);
                log.info("User {} (ELO {}) joined Octagon queue. Queue size: {}",
                        session.getUserId(), session.getCurrentElo(), waitingQueue.size());
            }
        }
    }

    public void leaveQueue(OctagonSession session) {
        synchronized (matchLock) {
            waitingQueue.remove(session);
            session.setQueuedAt(null);
        }
    }

    void matchmakingTick() {
        try {
            synchronized (matchLock) {
                if (waitingQueue.isEmpty()) return;

                Instant now = Instant.now();
                Set<OctagonSession> matched = new HashSet<>();
                List<OctagonSession> snapshot = new ArrayList<>(waitingQueue);

                for (int i = 0; i < snapshot.size(); i++) {
                    OctagonSession p1 = snapshot.get(i);
                    if (matched.contains(p1)) continue;
                    if (!p1.isOpen() || p1.getQueuedAt() == null) {
                        matched.add(p1); // yopilgan sessiya navbatdan chiqariladi
                        continue;
                    }

                    long waitSec = Duration.between(p1.getQueuedAt(), now).getSeconds();

                    // 1. Try finding live human opponent (ELO oynasi kutish bilan kengayadi)
                    OctagonSession p2 = null;
                    for (int j = i + 1; j < snapshot.size(); j++) {
                        OctagonSession candidate = snapshot.get(j);
                        if (matched.contains(candidate) || !candidate.isOpen() || candidate.getQueuedAt() == null) continue;
                        if (candidate.getUserId().equals(p1.getUserId())) continue;

                        int eloDiff = Math.abs(p1.getCurrentElo() - candidate.getCurrentElo());
                        if ((waitSec < ELO_STRICT_SEC && eloDiff <= 30)
                                || (waitSec < ELO_WIDE_SEC && eloDiff <= 80)
                                || waitSec >= ELO_WIDE_SEC) {
                            p2 = candidate;
                            break;
                        }
                    }

                    if (p2 != null) {
                        matched.add(p1);
                        matched.add(p2);
                        createMatch(p1, p2, OctagonGameType.RANKED_QUEUE);
                    } else if (waitSec >= BOT_FALLBACK_SEC) {
                        // 2. 7 soniyada inson topilmadi — o'yinchi cheksiz kutib qolmasin, bot ulanadi
                        matched.add(p1);
                        createBotMatch(p1);
                    }
                }

                waitingQueue.removeAll(matched);
                for (OctagonSession s : matched) s.setQueuedAt(null);
                broadcastQueueStatus(now);
            }
        } catch (Exception e) {
            log.error("Error in matchmaking tick: {}", e.getMessage(), e);
        }
    }

    // ----------------------------------------------------
    // MATCH CREATION
    // ----------------------------------------------------

    public void createDirectMatch(OctagonSession p1, OctagonSession p2, OctagonGameType gameType) {
        synchronized (matchLock) {
            createMatch(p1, p2, gameType);
        }
    }

    /** matchLock ostida chaqiriladi. */
    private ActiveMatch createMatch(OctagonSession p1, OctagonSession p2, OctagonGameType gameType) {
        if (hasLiveMatch(p1.getUserId()) || hasLiveMatch(p2.getUserId())) {
            log.warn("Refusing to create match: {} or {} already in a live match", p1.getUserId(), p2.getUserId());
            return null;
        }
        List<Long> questionIds = octagonService.getRandomQuestionIds(QUESTIONS_PER_MATCH);
        if (questionIds.isEmpty()) {
            sendMatchError(p1);
            sendMatchError(p2);
            return null;
        }
        Map<Long, Integer> correctOptions = loadCorrectOptions(questionIds);
        waitingQueue.remove(p1);
        waitingQueue.remove(p2);
        p1.setQueuedAt(null);
        p2.setQueuedAt(null);

        UUID matchId = UUID.randomUUID();
        ActiveMatch match = new ActiveMatch(
                matchId, p1, p2,
                p2.getUserId(), p2.getDisplayName(), p2.getCurrentElo(),
                false, gameType, questionIds, correctOptions
        );
        match.setQuestionPayload(loadQuestionPayload(questionIds));
        match.setPlayer1Avatar(p1.getAvatarUrl());
        match.setPlayer2Avatar(p2.getAvatarUrl());

        p1.setCurrentMatchId(matchId);
        p2.setCurrentMatchId(matchId);
        userOngoingMatchMap.put(p1.getUserId(), matchId);
        userOngoingMatchMap.put(p2.getUserId(), matchId);
        activeMatches.put(matchId, match);

        log.info("Created match {} ({}) between {} and {}", matchId, gameType, p1.getUserId(), p2.getUserId());

        sendMatchFound(match, p1, opponentCard(p2.getUserId(), p2.getDisplayName(), p2.getCurrentElo(), p2.getAvatarUrl()));
        sendMatchFound(match, p2, opponentCard(p1.getUserId(), p1.getDisplayName(), p1.getCurrentElo(), p1.getAvatarUrl()));

        schedulePreloadAndCountdown(match);
        return match;
    }

    /** matchLock ostida chaqiriladi. */
    private ActiveMatch createBotMatch(OctagonSession p1) {
        // Bot oddiy o'yinchidek: haqiqiy ism (ID'dan deterministik), o'yinchiga yaqin ELO
        String botId = OctagonBotPersonas.newBotId();
        return createBotMatch(p1, botId, OctagonBotPersonas.nameFor(botId),
                Math.max(0, p1.getCurrentElo() + (RANDOM.nextInt(61) - 30)));
    }

    /** Revansh botga qarshi bo'lsa — o'sha raqib (ism/ELO) qaytadi. */
    private ActiveMatch createBotMatch(OctagonSession p1, String botId, String botName, int botElo) {
        if (hasLiveMatch(p1.getUserId())) return null;
        List<Long> questionIds = octagonService.getRandomQuestionIds(QUESTIONS_PER_MATCH);
        if (questionIds.isEmpty()) {
            sendMatchError(p1);
            return null;
        }
        Map<Long, Integer> correctOptions = loadCorrectOptions(questionIds);
        waitingQueue.remove(p1);
        p1.setQueuedAt(null);

        UUID matchId = UUID.randomUUID();

        ActiveMatch match = new ActiveMatch(
                matchId, p1, null,
                botId, botName, botElo,
                true, OctagonGameType.BOT_TRAINING, questionIds, correctOptions
        );
        match.setQuestionPayload(loadQuestionPayload(questionIds));
        match.setPlayer1Avatar(p1.getAvatarUrl());

        OctagonGameBot bot = new OctagonGameBot(botId, botName, botElo, match, scheduler,
                this::sendBotProgressToPlayer,
                () -> checkAndEndMatchIfFinished(match)
        );
        match.setBot(bot);

        p1.setCurrentMatchId(matchId);
        userOngoingMatchMap.put(p1.getUserId(), matchId);
        activeMatches.put(matchId, match);

        log.info("Created BOT match {} for user {} against bot {}", matchId, p1.getUserId(), botName);

        sendMatchFound(match, p1, opponentCard(botId, botName, botElo, null));
        schedulePreloadAndCountdown(match);
        return match;
    }

    private static String rankName(OctagonRank rank) {
        return (rank != null ? rank : OctagonRank.BRONZE).name().toLowerCase();
    }

    /**
     * Raqib kartasi (match_found / game_reconnect): ism hech qachon bo'sh emas, liga ELO'dan,
     * rasm bo'lmasa {@code avatar: null} (avval mavjud bo'lmagan "/images/default-avatar.webp" yuborilib,
     * klientda buzilgan rasm chiqardi).
     */
    static Map<String, Object> opponentCard(String id, String name, int elo, String avatarUrl) {
        OctagonRank rank = OctagonRank.fromElo(elo);
        Map<String, Object> opp = new HashMap<>();
        opp.put("id", id);
        opp.put("name", name != null && !name.isBlank() ? name : "Haydovchi");
        opp.put("score", elo);
        opp.put("elo", elo);
        opp.put("rank", rankName(rank));
        opp.put("rankEmoji", rank.getEmoji());
        opp.put("avatar", avatarUrl);
        return opp;
    }

    private void sendMatchError(OctagonSession s) {
        sendEvent(s, "match_error", Map.of("code", "NO_QUESTIONS", "message", "Savollar topilmadi, keyinroq urinib ko'ring"));
    }

    private void sendMatchFound(ActiveMatch match, OctagonSession session, Map<String, Object> opp) {
        Map<String, Object> data = new HashMap<>();
        data.put("matchId", match.getMatchId().toString());
        data.put("opponent", opp);
        data.put("questionIds", match.getQuestionIds());
        data.put("questions", match.getQuestionPayload());
        data.put("preloadDurationMs", PRELOAD_MS);

        sendEvent(session, "match_found", data);
    }

    private void schedulePreloadAndCountdown(ActiveMatch match) {
        scheduler.schedule(() -> sendBroadcastEvent(match, "countdown_tick", Map.of("count", 3)), PRELOAD_MS, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> sendBroadcastEvent(match, "countdown_tick", Map.of("count", 2)), PRELOAD_MS + 1000, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> sendBroadcastEvent(match, "countdown_tick", Map.of("count", 1)), PRELOAD_MS + 2000, TimeUnit.MILLISECONDS);

        scheduler.schedule(() -> {
            if (match.isEnded()) return;
            Instant start = Instant.now();
            match.setDeadlineAt(start.plusSeconds(MATCH_DURATION_SEC));
            match.setStartedAt(start);

            Map<String, Object> startData = Map.of(
                    "totalDurationSec", MATCH_DURATION_SEC,
                    "startTime", start.toEpochMilli()
            );
            sendBroadcastEvent(match, "match_started", startData);

            if (match.isBotMatch() && match.getBot() != null) {
                match.getBot().start();
            }
        }, PRELOAD_MS + 3000, TimeUnit.MILLISECONDS);
    }

    // ----------------------------------------------------
    // GAMEPLAY
    // ----------------------------------------------------

    public void handleSubmitAnswer(OctagonSession session, UUID matchId, Long questionId, int selectedIndex, long clientTimestamp) {
        ActiveMatch match = activeMatches.get(matchId);
        if (match == null || match.isEnded() || !match.isParticipant(session.getUserId())) return;

        Instant now = Instant.now();
        if (match.getStartedAt() != null) {
            long msSinceStart = Duration.between(match.getStartedAt(), now).toMillis();
            if (msSinceStart < 350) {
                log.warn("Anti-cheat flag: answer submitted in {}ms (< 350ms) by {}", msSinceStart, session.getUserId());
            }
        }

        ActiveMatch.AnswerOutcome outcome = match.recordAnswer(session.getUserId(), questionId, selectedIndex, now);
        if (outcome == ActiveMatch.AnswerOutcome.REJECTED) {
            log.debug("Rejected answer from {} for question {} in match {}", session.getUserId(), questionId, matchId);
            return;
        }

        boolean isP1 = session.getUserId().equals(match.getPlayer1Id());
        int answeredCount = isP1 ? match.getPlayer1Answers().size() : match.getPlayer2Answers().size();
        int correctCount = isP1 ? match.getPlayer1Score() : match.getPlayer2Score();
        int questionIndex = match.getQuestionIds().indexOf(questionId);

        // O'yinchining o'ziga natija (to'g'ri variant indeksi oshkor qilinmaydi — raqib xuddi shu savollarni yechmoqda)
        sendEvent(session, "answer_result", Map.of(
                "questionId", questionId,
                "isCorrect", outcome == ActiveMatch.AnswerOutcome.CORRECT,
                "myScore", correctCount,
                "answeredCount", answeredCount
        ));

        OctagonSession oppSession = match.getOpponentSession(session.getUserId());
        if (oppSession != null) {
            sendEvent(oppSession, "opponent_progress", progressPayload(match, questionIndex, answeredCount, correctCount));
        }

        checkAndEndMatchIfFinished(match);
    }

    /**
     * Raqib holati: nechanchi savolda, nechtasiga javob bergan va hammasini tugatganmi ("finished") —
     * klient "Raqib barcha savollarni yakunladi" bannerini shu flag bo'yicha ko'rsatadi.
     */
    static Map<String, Object> progressPayload(ActiveMatch match, int questionIndex, int answeredCount, int correctCount) {
        int total = match.getQuestionIds().size();
        return Map.of(
                "questionIndex", questionIndex,
                "answeredCount", answeredCount,
                "correctCount", correctCount,
                "totalQuestions", total,
                "finished", total > 0 && answeredCount >= total
        );
    }

    private void sendBotProgressToPlayer(ActiveMatch match, String optionalEmoji) {
        int answered = match.getPlayer2Answers().size();
        int correct = match.getPlayer2Score();
        int lastQIdx = Math.min(match.getQuestionIds().size() - 1, Math.max(0, answered - 1));

        sendEvent(match.getP1Session(), "opponent_progress", progressPayload(match, lastQIdx, answered, correct));

        if (optionalEmoji != null) {
            sendEvent(match.getP1Session(), "opponent_reaction", Map.of("emojiId", optionalEmoji));
        }
    }

    private static final Set<String> ALLOWED_REACTIONS = Set.of("fire", "thumbs_up", "mindblown", "laugh");

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

        if (emojiId == null || !ALLOWED_REACTIONS.contains(emojiId)) return;
        ActiveMatch match = activeMatches.get(matchId);
        if (match == null || match.isEnded() || !match.isParticipant(session.getUserId())) return;

        OctagonSession opp = match.getOpponentSession(session.getUserId());
        if (opp != null) {
            sendEvent(opp, "opponent_reaction", Map.of("emojiId", emojiId));
        }
    }

    public void handleRequestRevenge(OctagonSession session, UUID matchId) {
        ActiveMatch match = activeMatches.get(matchId);
        if (match == null || !match.isEnded() || !match.isParticipant(session.getUserId())) return;

        boolean isP1 = session.getUserId().equals(match.getPlayer1Id());
        if (isP1) {
            match.setP1WantsRevenge(true);
        } else {
            match.setP2WantsRevenge(true);
        }

        synchronized (matchLock) {
            if (match.isBotMatch()) {
                if (match.isP1WantsRevenge() && match.tryClaimRematch()) {
                    createBotMatch(session, match.getPlayer2Id(), match.getPlayer2Name(), match.getPlayer2Elo());
                }
            } else if (match.isP1WantsRevenge() && match.isP2WantsRevenge()) {
                OctagonSession p1 = activeSessions.get(match.getPlayer1Id());
                OctagonSession p2 = activeSessions.get(match.getPlayer2Id());
                if (p1 != null && p2 != null && p1.isOpen() && p2.isOpen() && match.tryClaimRematch()) {
                    createMatch(p1, p2, match.getGameType());
                }
            } else {
                OctagonSession opp = activeSessions.get(isP1 ? match.getPlayer2Id() : match.getPlayer1Id());
                sendEvent(opp, "revenge_requested", Map.of("matchId", matchId.toString()));
            }
        }
    }

    private void checkAndEndMatchIfFinished(ActiveMatch match) {
        if (match.isEnded()) return;
        if (match.isBothFinished()) {
            finalizeMatch(match, null);
        }
    }

    /** Jangni bir martagina yakunlaydi (timeout, tashlab ketish va oxirgi javob bir vaqtda kelishi mumkin). */
    private void finalizeMatch(ActiveMatch match, String forfeitUserId) {
        if (!match.tryEnd(Instant.now())) return;

        if (match.getBot() != null) {
            match.getBot().stop();
        }

        int durationSec = match.getStartedAt() != null
                ? (int) Duration.between(match.getStartedAt(), Instant.now()).getSeconds()
                : 0;

        OctagonMatch persisted;
        try {
            persisted = octagonService.recordMatchResult(
                    match.getMatchId(),
                    match.getPlayer1Id(),
                    match.getPlayer2Id(),
                    match.getPlayer1Score(),
                    match.getPlayer2Score(),
                    match.getQuestionIds(),
                    durationSec,
                    match.getGameType(),
                    forfeitUserId
            );
        } catch (Exception e) {
            log.error("Failed to persist Octagon match {}: {}", match.getMatchId(), e.getMessage(), e);
            persisted = null;
        } finally {
            userOngoingMatchMap.remove(match.getPlayer1Id(), match.getMatchId());
            userOngoingMatchMap.remove(match.getPlayer2Id(), match.getMatchId());
        }

        String winnerId = persisted != null && persisted.getWinnerId() != null ? persisted.getWinnerId() : "";
        boolean isDraw = persisted != null ? Boolean.TRUE.equals(persisted.getIsDraw()) : match.getPlayer1Score() == match.getPlayer2Score();
        int p1Delta = persisted != null ? persisted.getP1EloChange() : 0;
        int p2Delta = persisted != null ? persisted.getP2EloChange() : 0;

        sendMatchEnded(activeSessions.getOrDefault(match.getPlayer1Id(), match.getP1Session()), match,
                winnerId, isDraw, p1Delta, p2Delta, match.getPlayer1Score(), match.getPlayer2Score(), forfeitUserId);
        if (!match.isBotMatch()) {
            sendMatchEnded(activeSessions.getOrDefault(match.getPlayer2Id(), match.getP2Session()), match,
                    winnerId, isDraw, p2Delta, p1Delta, match.getPlayer2Score(), match.getPlayer1Score(), forfeitUserId);
        }
    }

    private void sendMatchEnded(OctagonSession s, ActiveMatch match, String winnerId, boolean isDraw,
                                int myDelta, int oppDelta, int myScore, int oppScore, String forfeitUserId) {
        if (s == null) return;
        Map<String, Object> data = new HashMap<>();
        data.put("matchId", match.getMatchId().toString());
        data.put("winnerId", winnerId);
        data.put("isDraw", isDraw);
        data.put("myDeltaElo", myDelta);
        data.put("opponentDeltaElo", oppDelta);
        data.put("finalScores", Map.of("me", myScore, "opponent", oppScore));
        data.put("forfeit", forfeitUserId != null);
        // Natija ekrani: "8/10 to'g'ri (80%)" va "Yangi reyting" — ELO bazadan (jang yozilgandan keyin)
        data.put("totalQuestions", match.getQuestionIds().size());
        try {
            OctagonProfile profile = octagonService.getProfileSnapshot(s.getUserId());
            if (profile != null) {
                data.put("myNewElo", profile.getEloRating());
                s.setCurrentElo(profile.getEloRating());
                s.setRank(OctagonRank.fromElo(profile.getEloRating()));
            }
        } catch (Exception e) {
            log.debug("New ELO unavailable for {}: {}", s.getUserId(), e.getMessage());
        }
        sendEvent(s, "match_ended", data);
    }

    private void handleReconnect(OctagonSession session, ActiveMatch match) {
        session.setCurrentMatchId(match.getMatchId());
        boolean isP1 = session.getUserId().equals(match.getPlayer1Id());
        if (isP1) {
            match.setP1Session(session);
        } else {
            match.setP2Session(session);
        }
        sendGameState(session, match);
    }

    /** Klient "game_reconnect" so'rasa (ilova fondan qaytdi) — joriy holatni qayta yuboradi. */
    public void handleClientReconnectRequest(OctagonSession session) {
        UUID id = userOngoingMatchMap.get(session.getUserId());
        ActiveMatch match = id != null ? activeMatches.get(id) : null;
        if (match != null && !match.isEnded()) {
            sendGameState(session, match);
        }
    }

    private void sendGameState(OctagonSession session, ActiveMatch match) {
        boolean isP1 = session.getUserId().equals(match.getPlayer1Id());
        Map<Long, Integer> mine = isP1 ? match.getPlayer1Answers() : match.getPlayer2Answers();
        int oppAnswered = isP1 ? match.getPlayer2Answers().size() : match.getPlayer1Answers().size();
        int oppScore = isP1 ? match.getPlayer2Score() : match.getPlayer1Score();

        long remainingSec = match.getDeadlineAt() != null
                ? Math.max(0, Duration.between(Instant.now(), match.getDeadlineAt()).getSeconds())
                : MATCH_DURATION_SEC;

        Map<String, Object> opp = isP1
                ? opponentCard(match.getPlayer2Id(), match.getPlayer2Name(), match.getPlayer2Elo(), match.getPlayer2Avatar())
                : opponentCard(match.getPlayer1Id(), match.getPlayer1Name(), match.getPlayer1Elo(), match.getPlayer1Avatar());

        Map<String, Object> reconnectData = new HashMap<>();
        reconnectData.put("matchId", match.getMatchId().toString());
        reconnectData.put("started", match.getStartedAt() != null);
        reconnectData.put("questionIndex", mine.size());
        reconnectData.put("myAnswers", mine);
        reconnectData.put("myScore", isP1 ? match.getPlayer1Score() : match.getPlayer2Score());
        reconnectData.put("opponent", opp);
        reconnectData.put("opponentProgress",
                progressPayload(match, Math.max(0, oppAnswered - 1), oppAnswered, oppScore));
        reconnectData.put("remainingTimeSec", remainingSec);
        reconnectData.put("questionIds", match.getQuestionIds());
        reconnectData.put("questions", match.getQuestionPayload());

        sendEvent(session, "game_reconnect", reconnectData);
    }

    void cleanupAndTimeoutTick() {
        try {
            Instant now = Instant.now();

            for (ActiveMatch match : activeMatches.values()) {
                if (match.isEnded()) {
                    // Xotira oqishi: tugagan janglar avval hech qachon o'chirilmasdi
                    if (match.getEndedAt() != null && now.isAfter(match.getEndedAt().plusSeconds(ENDED_RETENTION_SEC))) {
                        activeMatches.remove(match.getMatchId());
                    }
                    continue;
                }

                // 1. Jang vaqti tugadi
                if (match.getDeadlineAt() != null && now.isAfter(match.getDeadlineAt())) {
                    log.info("Match {} timed out after {} seconds. Finalizing...", match.getMatchId(), MATCH_DURATION_SEC);
                    finalizeMatch(match, null);
                    continue;
                }

                // 2. Uzilgan o'yinchi grace-period ichida qaytmadi — texnik mag'lubiyat
                if (isAbandoned(match.getPlayer1Id(), match.getP1Session(), now)) {
                    log.info("Player 1 {} abandoned match {}", match.getPlayer1Id(), match.getMatchId());
                    finalizeMatch(match, match.getPlayer1Id());
                } else if (!match.isBotMatch() && isAbandoned(match.getPlayer2Id(), match.getP2Session(), now)) {
                    log.info("Player 2 {} abandoned match {}", match.getPlayer2Id(), match.getMatchId());
                    finalizeMatch(match, match.getPlayer2Id());
                }
            }

            for (GroupRoom room : groupRooms.values()) {
                if ("PLAYING".equals(room.getStatus()) && !room.isEnded() && room.getDeadlineAt() != null && now.isAfter(room.getDeadlineAt())) {
                    log.info("Group room {} timed out. Finalizing...", room.getRoomCode());
                    finalizeGroupRoom(room);
                } else if (room.isEnded() && room.getEndedAt() != null && now.isAfter(room.getEndedAt().plusSeconds(ENDED_RETENTION_SEC))) {
                    groupRooms.remove(room.getRoomCode());
                    for (String memberId : room.getMembers().keySet()) {
                        userRoomMap.remove(memberId, room.getRoomCode());
                    }
                }
            }

            pendingChallenges.values().removeIf(PendingChallenge::isExpired);
        } catch (Exception e) {
            log.error("Error in Octagon cleanup tick: {}", e.getMessage(), e);
        }
    }

    private boolean isAbandoned(String userId, OctagonSession matchSession, Instant now) {
        OctagonSession live = activeSessions.get(userId);
        if (live != null && live.isOpen()) return false;
        Instant disconnectedAt = matchSession != null ? matchSession.getDisconnectedAt() : null;
        return disconnectedAt != null && Duration.between(disconnectedAt, now).getSeconds() > DISCONNECT_GRACE_SEC;
    }

    // ----------------------------------------------------
    // FRIEND DUEL CHALLENGES
    // ----------------------------------------------------
    public void handleSendChallenge(OctagonSession challenger, String targetUserId) {
        if (targetUserId == null || targetUserId.isBlank()) return;

        Instant now = Instant.now();
        if (Duration.between(challenger.getChallengeWindowStart(), now).getSeconds() >= 60) {
            challenger.setChallengeWindowStart(now);
            challenger.setChallengesInWindow(0);
        }
        if (challenger.getChallengesInWindow() >= MAX_CHALLENGES_PER_MINUTE) {
            sendEvent(challenger, "challenge_error", Map.of(
                    "code", "RATE_LIMITED",
                    "message", "Juda ko'p taklif yuborildi, birozdan keyin urinib ko'ring"
            ));
            return;
        }
        challenger.setChallengesInWindow(challenger.getChallengesInWindow() + 1);

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
                "targetUserId", targetUserId,
                "targetName", target.getDisplayName() != null ? target.getDisplayName() : "Haydovchi",
                "expiresInSec", CHALLENGE_TTL_SEC
        ));

        Map<String, Object> challengerCard = new HashMap<>();
        challengerCard.put("userId", challenger.getUserId());
        challengerCard.put("displayName", challenger.getDisplayName());
        challengerCard.put("eloRating", challenger.getCurrentElo());
        challengerCard.put("rank", rankName(OctagonRank.fromElo(challenger.getCurrentElo())));
        challengerCard.put("rankEmoji", OctagonRank.fromElo(challenger.getCurrentElo()).getEmoji());
        challengerCard.put("avatarUrl", challenger.getAvatarUrl());
        sendEvent(target, "challenge_received", Map.of(
                "challengeId", challengeId.toString(),
                "challenger", challengerCard,
                "expiresInSec", CHALLENGE_TTL_SEC
        ));

        scheduler.schedule(() -> {
            PendingChallenge exp = pendingChallenges.remove(challengeId);
            if (exp != null) {
                OctagonSession ch = activeSessions.get(exp.challengerId);
                if (ch != null) {
                    sendEvent(ch, "challenge_error", Map.of("code", "CHALLENGE_TIMEOUT", "message", "Taklifga javob berilmadi"));
                }
                OctagonSession tg = activeSessions.get(exp.targetUserId);
                if (tg != null) {
                    sendEvent(tg, "challenge_cancelled", Map.of("challengeId", challengeId.toString(), "reason", "TIMEOUT"));
                }
            }
        }, CHALLENGE_TTL_SEC, TimeUnit.SECONDS);
    }

    /** Chaqiruvchi kutishni bekor qildi — raqibdagi taklif oynasi yopiladi. */
    public void handleCancelChallenge(OctagonSession challenger, UUID challengeId) {
        PendingChallenge pc = pendingChallenges.get(challengeId);
        if (pc == null || !pc.challengerId.equals(challenger.getUserId())) return;
        pendingChallenges.remove(challengeId);
        OctagonSession target = activeSessions.get(pc.targetUserId);
        if (target != null) {
            sendEvent(target, "challenge_cancelled", Map.of("challengeId", challengeId.toString(), "reason", "CANCELLED"));
        }
    }

    /**
     * Havola/QR/kod orqali duel: taklif egasi Oktagon'da onlayn bo'lsa, ikkalasi o'rtasida darhol jang ochiladi.
     * Avval klient kodni e'tiborsiz qoldirib, tasodifiy raqib qidirardi.
     */
    public void handleJoinInvite(OctagonSession joiner, String inviteCode) {
        if (codeGuard.isBlocked(joiner.getUserId())) {
            sendEvent(joiner, "challenge_error", Map.of("code", "RATE_LIMITED",
                    "message", "Juda ko'p noto'g'ri kod kiritildi. 1 daqiqadan so'ng qayta urinib ko'ring"));
            return;
        }
        Optional<OctagonChallenge> invite = octagonService.getChallenge(inviteCode);
        if (invite.isEmpty()) {
            codeGuard.recordFailure(joiner.getUserId());
            sendEvent(joiner, "challenge_error", Map.of("code", "INVITE_NOT_FOUND",
                    "message", "Bunday kod topilmadi yoki muddati o'tgan"));
            return;
        }
        OctagonChallenge c = invite.get();
        if (c.getChallengerId().equals(joiner.getUserId())) {
            sendEvent(joiner, "challenge_error", Map.of("code", "OWN_INVITE",
                    "message", "Bu sizning taklifingiz — havolani do'stingizga yuboring"));
            return;
        }
        OctagonSession inviter = activeSessions.get(c.getChallengerId());
        if (inviter == null || !inviter.isOpen() || hasLiveMatch(c.getChallengerId())) {
            sendEvent(joiner, "challenge_error", Map.of("code", "INVITER_OFFLINE",
                    "message", "Taklif egasi hozir Oktagon'da emas. Keyinroq urinib ko'ring"));
            return;
        }
        if (hasLiveMatch(joiner.getUserId())) return;

        log.info("Invite duel {}: {} vs {}", c.getInviteCode(), c.getChallengerId(), joiner.getUserId());
        handleLeaveRoom(inviter);
        handleLeaveRoom(joiner);
        leaveQueue(inviter);
        leaveQueue(joiner);
        createDirectMatch(inviter, joiner, OctagonGameType.DUEL_FRIEND);
        if (hasLiveMatch(joiner.getUserId())) {
            octagonService.markInviteAccepted(c.getId());
        }
    }

    public void handleAcceptChallenge(OctagonSession targetSession, UUID challengeId) {
        PendingChallenge pc = pendingChallenges.get(challengeId);
        if (pc != null && !pc.targetUserId.equals(targetSession.getUserId())) {
            // Taklif boshqa foydalanuvchiga yuborilgan — qabul qilib bo'lmaydi
            sendEvent(targetSession, "challenge_error", Map.of(
                    "code", "CHALLENGE_EXPIRED",
                    "message", "Taklif muddati tugagan"
            ));
            return;
        }
        pc = pendingChallenges.remove(challengeId);
        if (pc == null || pc.isExpired()) {
            sendEvent(targetSession, "challenge_error", Map.of(
                    "code", "CHALLENGE_EXPIRED",
                    "message", "Taklif muddati tugagan"
            ));
            return;
        }

        OctagonSession challengerSession = activeSessions.get(pc.challengerId);
        if (challengerSession == null || !challengerSession.isOpen() || hasLiveMatch(pc.challengerId)) {
            sendEvent(targetSession, "challenge_error", Map.of(
                    "code", "CHALLENGER_UNAVAILABLE",
                    "message", "Raqib hozir mavjud emas"
            ));
            return;
        }

        log.info("Direct duel accepted: {} vs {}", pc.challengerId, targetSession.getUserId());
        handleLeaveRoom(challengerSession);
        handleLeaveRoom(targetSession);
        createDirectMatch(challengerSession, targetSession, OctagonGameType.DUEL_FRIEND);
    }

    public void handleRejectChallenge(OctagonSession session, UUID challengeId) {
        PendingChallenge pc = pendingChallenges.get(challengeId);
        if (pc == null) return;
        if (!pc.targetUserId.equals(session.getUserId()) && !pc.challengerId.equals(session.getUserId())) return;
        pendingChallenges.remove(challengeId);
        OctagonSession ch = activeSessions.get(pc.challengerId);
        if (ch != null) {
            sendEvent(ch, "challenge_rejected", Map.of(
                    "challengeId", challengeId.toString(),
                    "byUserId", session.getUserId()
            ));
        }
    }

    // ----------------------------------------------------
    // GROUP ROOMS (GURUHLI BAHS)
    // ----------------------------------------------------
    public void handleCreateRoom(OctagonSession session, int maxPlayers, boolean isPrivate) {
        if (hasLiveMatch(session.getUserId())) return;
        handleLeaveRoom(session);
        leaveQueue(session);

        String roomCode = generateRoomCode();
        if (roomCode == null) {
            sendEvent(session, "room_error", Map.of("code", "ROOM_CODES_BUSY",
                    "message", "Hozir bo'sh xona kodi yo'q. Birozdan keyin qayta urinib ko'ring"));
            return;
        }
        GroupRoom room = new GroupRoom(roomCode, session.getUserId(), maxPlayers, isPrivate);

        GroupRoomMember host = newMember(session, true);
        room.getMembers().put(session.getUserId(), host);
        groupRooms.put(roomCode, room);
        userRoomMap.put(session.getUserId(), roomCode);

        sendEvent(session, "room_created", Map.of("room", toRoomDto(room)));
        broadcastRoomUpdated(room);
    }

    private GroupRoomMember newMember(OctagonSession session, boolean isHost) {
        OctagonProfile profile = octagonService.getProfileSnapshot(session.getUserId());
        int elo = profile != null ? profile.getEloRating() : session.getCurrentElo();
        OctagonRank rank = OctagonRank.fromElo(elo);
        return new GroupRoomMember(
                session.getUserId(),
                session.getDisplayName(),
                session.getAvatarUrl(),
                elo,
                rank.getEmoji(),
                isHost
        );
    }

    public void handleJoinRoom(OctagonSession session, String roomCode) {
        if (roomCode == null || roomCode.isBlank() || roomCode.length() > 16) return;
        if (hasLiveMatch(session.getUserId())) return;

        // Kod maydoni kichik — noto'g'ri urinishlar foydalanuvchi bo'yicha sanaladi (qayta ulanish nollamaydi)
        if (codeGuard.isBlocked(session.getUserId())) {
            sendEvent(session, "room_error", Map.of("code", "RATE_LIMITED", "message", "Juda ko'p urinish, birozdan keyin qayta urinib ko'ring"));
            return;
        }

        String code = roomCode.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
        GroupRoom room = groupRooms.get(code);

        if (room == null) {
            codeGuard.recordFailure(session.getUserId());
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

        if (!code.equals(userRoomMap.get(session.getUserId()))) {
            handleLeaveRoom(session);
        }
        leaveQueue(session);

        room.getMembers().put(session.getUserId(), newMember(session, session.getUserId().equals(room.getHostUserId())));
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
            return;
        }
        if (session.getUserId().equals(room.getHostUserId())) {
            GroupRoomMember nextHost = room.getMembers().values().iterator().next();
            nextHost.setHost(true);
            nextHost.setReady(true);
            room.setHostUserId(nextHost.getUserId());
        }
        broadcastRoomUpdated(room);

        // O'yin davomida chiqib ketdi — qolganlar tugatgan bo'lsa, xona yakunlanadi
        if ("PLAYING".equals(room.getStatus()) && !room.isEnded()
                && room.getMembers().values().stream().allMatch(GroupRoomMember::isFinished)) {
            finalizeGroupRoom(room);
        }
    }

    public void handleToggleReady(OctagonSession session, boolean isReady) {
        String code = userRoomMap.get(session.getUserId());
        if (code == null) return;

        GroupRoom room = groupRooms.get(code);
        if (room == null || !"WAITING".equals(room.getStatus())) return;

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

        // Faqat kutish holatidan boshlanadi (avval o'yin davomida qayta "start" savollarni almashtirardi)
        if (!"WAITING".equals(room.getStatus())) return;
        List<Long> questionIds = octagonService.getRandomQuestionIds(QUESTIONS_PER_MATCH);
        if (questionIds.isEmpty()) {
            sendEvent(session, "room_error", Map.of("code", "NO_QUESTIONS", "message", "Savollar topilmadi, keyinroq urinib ko'ring"));
            return;
        }

        synchronized (room) {
            if (!"WAITING".equals(room.getStatus())) return;
            room.setStatus("COUNTDOWN");
            room.setQuestionIds(questionIds);
            room.setCorrectOptions(loadCorrectOptions(questionIds));
            room.setQuestionPayload(loadQuestionPayload(questionIds));
        }

        broadcastRoomEvent(room, "room_game_countdown", Map.of("count", 3));
        scheduler.schedule(() -> broadcastRoomEvent(room, "room_game_countdown", Map.of("count", 2)), 1000, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> broadcastRoomEvent(room, "room_game_countdown", Map.of("count", 1)), 2000, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> {
            Instant start = Instant.now();
            room.setStartedAt(start);
            room.setDeadlineAt(start.plusSeconds(MATCH_DURATION_SEC));
            room.setStatus("PLAYING");
            broadcastRoomEvent(room, "room_game_started", Map.of(
                    "roomCode", room.getRoomCode(),
                    "questionIds", room.getQuestionIds(),
                    "questions", room.getQuestionPayload(),
                    "totalDurationSec", MATCH_DURATION_SEC,
                    "startTime", start.toEpochMilli()
            ));
        }, 3000, TimeUnit.MILLISECONDS);
    }

    public void handleSubmitRoomAnswer(OctagonSession session, Long questionId, int selectedIndex, long clientTimestamp) {
        String code = userRoomMap.get(session.getUserId());
        if (code == null || questionId == null) return;

        GroupRoom room = groupRooms.get(code);
        if (room == null || !"PLAYING".equals(room.getStatus()) || room.isEnded()) return;
        Instant now = Instant.now();
        if (room.getDeadlineAt() != null && now.isAfter(room.getDeadlineAt())) return;
        if (!room.getQuestionIds().contains(questionId) || selectedIndex < 0 || selectedIndex > 9) return;

        GroupRoomMember member = room.getMembers().get(session.getUserId());
        if (member == null) return;

        boolean isCorrect;
        int answeredCount;
        synchronized (member) {
            if (member.getAnswers().containsKey(questionId)) return;
            member.getAnswers().put(questionId, selectedIndex);
            member.getAnswerTimes().put(questionId, now);
            Integer correct = room.getCorrectOptions().get(questionId);
            isCorrect = (correct != null && correct == selectedIndex);
            if (isCorrect) {
                member.setScore(member.getScore() + 1);
            }
            answeredCount = member.getAnswers().size();
            if (answeredCount >= room.getQuestionIds().size()) {
                member.setFinished(true);
            }
        }

        sendEvent(session, "answer_result", Map.of(
                "questionId", questionId,
                "isCorrect", isCorrect,
                "myScore", member.getScore(),
                "answeredCount", answeredCount
        ));

        broadcastRoomEvent(room, "group_progress", Map.of(
                "userId", member.getUserId(),
                "displayName", member.getDisplayName(),
                "questionIndex", room.getQuestionIds().indexOf(questionId),
                "answeredCount", answeredCount,
                "score", member.getScore()
        ));

        boolean allFinished = room.getMembers().values().stream().allMatch(GroupRoomMember::isFinished);
        if (allFinished) {
            finalizeGroupRoom(room);
        }
    }

    private void finalizeGroupRoom(GroupRoom room) {
        synchronized (room) {
            if (room.isEnded()) return;
            room.setEnded(true);
            room.setEndedAt(Instant.now());
            room.setStatus("FINISHED");
        }

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

    /** Diagnostika/testlar uchun: xotiradagi jang (tugagan bo'lsa ham, retention muddati ichida). */
    public Optional<ActiveMatch> findActiveMatch(UUID matchId) {
        return Optional.ofNullable(matchId != null ? activeMatches.get(matchId) : null);
    }

    /** Foydalanuvchi turgan xona kodi (yoki null). */
    public String getUserRoomCode(String userId) {
        return userId != null ? userRoomMap.get(userId) : null;
    }

    public GroupRoomDto toRoomDto(GroupRoom room) {
        GroupRoomMember hostMember = room.getMembers().get(room.getHostUserId());
        String hostName = hostMember != null ? hostMember.getDisplayName() : octagonService.resolveDisplayName(room.getHostUserId());
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

    /**
     * 4 raqamli xona kodi (hamkor talabi: og'zaki aytish oson). Faol xonalar orasida unikal — 25 martagacha
     * qayta tanlanadi; xona yopilganda kod bo'shaydi. Taxmin qilishdan {@link OctagonCodeGuard} himoya qiladi.
     */
    String generateRoomCode() {
        for (int attempt = 0; attempt < ROOM_CODE_ATTEMPTS; attempt++) {
            String code = String.valueOf(1000 + RANDOM.nextInt(9000));
            if (!groupRooms.containsKey(code)) return code;
        }
        log.warn("Could not allocate a unique Octagon room code after {} attempts", ROOM_CODE_ATTEMPTS);
        return null;
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

    private List<QuestionDto> loadQuestionPayload(List<Long> qIds) {
        try {
            List<QuestionDto> list = octagonService.getQuestionsByIds(qIds);
            return list != null ? list : List.of();
        } catch (Exception e) {
            log.warn("Failed to load Octagon question payload: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * REST /questions uchun: so'ralgan ID'larning barchasi hozir faol (yoki yaqinda tugagan) jang/xonaga
     * tegishlimi. Ixtiyoriy ID'lar bilan butun savollar bazasini yig'ib olishning oldini oladi.
     */
    public boolean areQuestionsInActiveGame(List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) return false;
        Set<Long> wanted = new HashSet<>(questionIds);
        for (ActiveMatch m : activeMatches.values()) {
            if (m.getQuestionIds().containsAll(wanted)) return true;
        }
        for (GroupRoom r : groupRooms.values()) {
            if (r.getQuestionIds().containsAll(wanted)) return true;
        }
        return false;
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
        private final Instant expiresAt = Instant.now().plusSeconds(CHALLENGE_TTL_SEC);

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
            this.avatarUrl = avatarUrl;
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
        private volatile Instant startedAt;
        private volatile Instant deadlineAt;
        private volatile Instant endedAt;
        private volatile List<Long> questionIds = new ArrayList<>();
        private volatile Map<Long, Integer> correctOptions = new HashMap<>();
        private volatile List<?> questionPayload = List.of();
        private volatile boolean isEnded = false;

        public GroupRoom(String roomCode, String hostUserId, int maxPlayers, boolean isPrivate) {
            this.roomCode = roomCode;
            this.hostUserId = hostUserId;
            this.maxPlayers = Math.max(2, Math.min(8, maxPlayers));
            this.isPrivate = isPrivate;
        }
    }
}
