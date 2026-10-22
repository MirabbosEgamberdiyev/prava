package uz.pravaimtihon.octagon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.QuestionOption;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.exception.ValidationException;
import uz.pravaimtihon.octagon.dto.OctagonDtos.*;
import uz.pravaimtihon.octagon.entity.OctagonChallenge;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.entity.OctagonReport;
import uz.pravaimtihon.octagon.enums.OctagonChallengeStatus;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonMatchStatus;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.repository.OctagonChallengeRepository;
import uz.pravaimtihon.octagon.repository.OctagonMatchRepository;
import uz.pravaimtihon.octagon.repository.OctagonProfileRepository;
import uz.pravaimtihon.octagon.repository.OctagonReportRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OctagonService {

    /** /questions bir so'rovda qaytaradigan savollar chegarasi (jang = 10 savol). */
    public static final int MAX_QUESTIONS_PER_REQUEST = 20;
    private static final Set<String> REPORT_REASONS = Set.of("CHEATING", "AFK", "INAPPROPRIATE_BEHAVIOR", "OTHER");
    private static final int MAX_REPORTS_PER_HOUR = 5;
    /**
     * Do'st taklifi kodi — 4 raqamli PIN (1000–9999): og'zaki aytish va yozish oson.
     * Faqat PENDING takliflar orasida unikal (V23 qisman unikal indeks); taklif qabul qilinganda yoki
     * muddati tugaganda kod bo'shaydi, har bir foydalanuvchida bir vaqtda bitta faol kod bo'ladi.
     */
    static final int INVITE_CODE_MIN = 1000;
    static final int INVITE_CODE_SPAN = 9000;
    static final int INVITE_CODE_ATTEMPTS = 25;
    static final long INVITE_TTL_MINUTES = 60;
    private static final String PUBLIC_BASE_URL = "https://pravaonline.uz";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OctagonProfileRepository profileRepository;
    private final OctagonMatchRepository matchRepository;
    private final OctagonChallengeRepository challengeRepository;
    private final OctagonReportRepository reportRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final OctagonEloCalculator eloCalculator;

    private final Map<String, Deque<Instant>> reportTimes = new ConcurrentHashMap<>();

    public static boolean isBotId(String userId) {
        return userId != null && userId.startsWith("bot");
    }

    private static OctagonProfile defaultProfile(String userId) {
        return OctagonProfile.builder()
                .userId(userId)
                .eloRating(0)
                .rank(OctagonRank.BRONZE)
                .wins(0)
                .losses(0)
                .draws(0)
                .winStreak(0)
                .maxWinStreak(0)
                .totalMatches(0)
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Transactional
    public OctagonProfile getOrCreateProfile(String userId) {
        if (isBotId(userId)) {
            // Bot profillari bazaga yozilmaydi (avval har bot-jang yangi "bot_xxxx" qatorini yaratardi).
            return defaultProfile(userId);
        }
        return profileRepository.findById(userId).orElseGet(() -> profileRepository.save(defaultProfile(userId)));
    }

    /** Bazaga yozmasdan profil holatini qaytaradi (yo'q bo'lsa — boshlang'ich qiymatlar). */
    @Transactional(readOnly = true)
    public OctagonProfile getProfileSnapshot(String userId) {
        if (userId == null || isBotId(userId)) return defaultProfile(userId);
        return profileRepository.findById(userId).orElseGet(() -> defaultProfile(userId));
    }

    @Transactional(readOnly = true)
    public StatsResponse getStats(String userId) {
        OctagonProfile profile = getProfileSnapshot(userId);
        String displayName = resolveDisplayName(userId);
        // Liga har doim ELO'dan hisoblanadi (ligalar shkalasi o'zgarganda eski qatorlar ham to'g'ri ko'rinadi)
        OctagonRank rank = OctagonRank.fromElo(profile.getEloRating());

        double winRate = profile.getTotalMatches() > 0
                ? ((double) profile.getWins() / profile.getTotalMatches()) * 100.0
                : 0.0;

        return StatsResponse.builder()
                .userId(userId)
                .displayName(displayName)
                .avatarUrl(resolveAvatarUrl(userId))
                .eloRating(profile.getEloRating())
                .rank(rank)
                .rankEmoji(rank.getEmoji())
                .rankName(rank.getDisplayName())
                .wins(profile.getWins())
                .losses(profile.getLosses())
                .draws(profile.getDraws())
                .winStreak(profile.getWinStreak())
                .maxWinStreak(profile.getMaxWinStreak())
                .totalMatches(profile.getTotalMatches())
                .winRate(Math.round(winRate * 10.0) / 10.0)
                .build();
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getLeaderboard(String period) {
        PageRequest pr = PageRequest.of(0, 50);
        List<OctagonProfile> profiles;

        if ("weekly".equalsIgnoreCase(period)) {
            profiles = profileRepository.findTopLeaderboardSince(LocalDateTime.now().minusDays(7), pr);
        } else if ("monthly".equalsIgnoreCase(period)) {
            profiles = profileRepository.findTopLeaderboardSince(LocalDateTime.now().minusDays(30), pr);
        } else {
            profiles = profileRepository.findTopLeaderboard(pr);
        }

        // N+1 o'rniga bitta so'rov bilan ismlar va rasmlar
        List<String> ids = profiles.stream().map(OctagonProfile::getUserId).toList();
        Map<String, String> names = resolveDisplayNames(ids);
        Map<String, String> avatars = resolveAvatarUrls(ids);

        List<LeaderboardEntry> result = new ArrayList<>();
        int position = 1;
        for (OctagonProfile p : profiles) {
            double winRate = p.getTotalMatches() > 0
                    ? ((double) p.getWins() / p.getTotalMatches()) * 100.0
                    : 0.0;
            OctagonRank rank = OctagonRank.fromElo(p.getEloRating());

            result.add(LeaderboardEntry.builder()
                    .position(position++)
                    .userId(p.getUserId())
                    .displayName(names.getOrDefault(p.getUserId(), "Foydalanuvchi"))
                    .avatarUrl(avatars.get(p.getUserId()))
                    .eloRating(p.getEloRating())
                    .rank(rank)
                    .rankEmoji(rank.getEmoji())
                    .wins(p.getWins())
                    .totalMatches(p.getTotalMatches())
                    .winRate(Math.round(winRate * 10.0) / 10.0)
                    .build());
        }

        return result;
    }

    /**
     * Peshqadamlar jadvalida foydalanuvchining o'z o'rni (jadval pastida alohida ko'rsatiladi). Shu davrda
     * jang o'ynamagan bo'lsa (haftalik/oylik) yoki profili bo'lmasa — empty.
     */
    @Transactional(readOnly = true)
    public Optional<LeaderboardEntry> getMyLeaderboardPosition(String userId, String period) {
        if (userId == null || isBotId(userId)) return Optional.empty();
        Optional<OctagonProfile> profile = profileRepository.findById(userId);
        if (profile.isEmpty() || profile.get().getTotalMatches() <= 0) return Optional.empty();
        OctagonProfile p = profile.get();

        long ahead;
        if ("weekly".equalsIgnoreCase(period) || "monthly".equalsIgnoreCase(period)) {
            LocalDateTime since = LocalDateTime.now().minusDays("weekly".equalsIgnoreCase(period) ? 7 : 30);
            if (p.getUpdatedAt() == null || p.getUpdatedAt().isBefore(since)) return Optional.empty();
            ahead = profileRepository.countAheadSince(since, p.getEloRating(), p.getWins());
        } else {
            ahead = profileRepository.countAhead(p.getEloRating(), p.getWins());
        }

        OctagonRank rank = OctagonRank.fromElo(p.getEloRating());
        double winRate = p.getTotalMatches() > 0 ? ((double) p.getWins() / p.getTotalMatches()) * 100.0 : 0.0;
        return Optional.of(LeaderboardEntry.builder()
                .position((int) Math.min(Integer.MAX_VALUE, ahead + 1))
                .userId(userId)
                .displayName(resolveDisplayName(userId))
                .avatarUrl(resolveAvatarUrl(userId))
                .eloRating(p.getEloRating())
                .rank(rank)
                .rankEmoji(rank.getEmoji())
                .wins(p.getWins())
                .totalMatches(p.getTotalMatches())
                .winRate(Math.round(winRate * 10.0) / 10.0)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<MatchHistoryEntry> getUserHistory(String userId, int page, int size) {
        return getUserHistory(userId, page, size, null);
    }

    /**
     * Janglar tarixi; {@code result} = WIN / LOSS / DRAW bo'lsa — filtr bazada qo'llanadi (sahifalash to'g'ri
     * ishlaydi), boshqa qiymat yoki null — barchasi.
     */
    public Page<MatchHistoryEntry> getUserHistory(String userId, int page, int size, String result) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(50, Math.max(1, size)));
        String filter = result == null ? "" : result.trim().toUpperCase(java.util.Locale.ROOT);
        Page<OctagonMatch> matches = switch (filter) {
            case "WIN" -> matchRepository.findUserWins(userId, pr);
            case "LOSS" -> matchRepository.findUserLosses(userId, pr);
            case "DRAW" -> matchRepository.findUserDraws(userId, pr);
            default -> matchRepository.findUserMatches(userId, pr);
        };

        List<String> opponentIds = matches.getContent().stream()
                .map(m -> userId.equals(m.getPlayer1Id()) ? m.getPlayer2Id() : m.getPlayer1Id())
                .toList();
        Map<String, String> names = resolveDisplayNames(opponentIds);
        Map<String, String> avatars = resolveAvatarUrls(opponentIds);

        return matches.map(m -> {
            boolean isP1 = userId.equals(m.getPlayer1Id());
            String oppId = isP1 ? m.getPlayer2Id() : m.getPlayer1Id();
            int myScore = isP1 ? m.getPlayer1Score() : m.getPlayer2Score();
            int oppScore = isP1 ? m.getPlayer2Score() : m.getPlayer1Score();
            int myDelta = isP1 ? m.getP1EloChange() : m.getP2EloChange();

            String outcome;
            if (Boolean.TRUE.equals(m.getIsDraw())) {
                outcome = "DRAW";
            } else if (userId.equals(m.getWinnerId())) {
                outcome = "WIN";
            } else {
                outcome = "LOSS";
            }

            return MatchHistoryEntry.builder()
                    .matchId(m.getId())
                    .opponentId(oppId)
                    .opponentName(names.getOrDefault(oppId, "Foydalanuvchi"))
                    .opponentAvatarUrl(avatars.get(oppId))
                    .myScore(myScore)
                    .opponentScore(oppScore)
                    .result(outcome)
                    .deltaElo(myDelta)
                    .durationSeconds(m.getDurationSeconds())
                    .createdAt(m.getCreatedAt())
                    .build();
        });
    }

    /** Ulashiladigan havola: pravaonline.uz/oktagon?code=4821 (sayt va mobil ilova kodni o'zi kiritadi). */
    public static String inviteUrl(String code) {
        return PUBLIC_BASE_URL + "/oktagon?code=" + code;
    }

    /**
     * Yangi taklif kodi. Avvalgi faol taklif(lar) yopiladi — foydalanuvchida bitta faol kod.
     * Bir vaqtda ikki so'rov bir xil kodni tanlasa, qisman unikal indeks saqlashni rad etadi
     * ({@link org.springframework.dao.DataIntegrityViolationException}); controller qayta urinadi.
     */
    @Transactional
    public ChallengeResponse createChallenge(String challengerId, String targetUserId) {
        LocalDateTime now = LocalDateTime.now();
        for (OctagonChallenge previous : challengeRepository.findByChallengerIdAndStatus(challengerId, OctagonChallengeStatus.PENDING)) {
            previous.setStatus(OctagonChallengeStatus.EXPIRED);
            challengeRepository.save(previous);
        }

        String code = generateInviteCode(now);
        UUID challengeId = UUID.randomUUID();
        LocalDateTime expiresAt = now.plusMinutes(INVITE_TTL_MINUTES);

        OctagonChallenge challenge = OctagonChallenge.builder()
                .id(challengeId)
                .challengerId(challengerId)
                .targetUserId(targetUserId)
                .inviteCode(code)
                .status(OctagonChallengeStatus.PENDING)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        challengeRepository.saveAndFlush(challenge);

        return ChallengeResponse.builder()
                .challengeId(challengeId)
                .inviteCode(code)
                .inviteUrl(inviteUrl(code))
                .challengerId(challengerId)
                .challengerName(resolveDisplayName(challengerId))
                .expiresAt(expiresAt)
                .build();
    }

    /** Faol (PENDING, muddati o'tmagan) taklifni kod bo'yicha topadi. */
    @Transactional(readOnly = true)
    public Optional<OctagonChallenge> getChallenge(String inviteCode) {
        String code = normalizeInviteCode(inviteCode);
        if (code == null) return Optional.empty();
        return challengeRepository.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(code, OctagonChallengeStatus.PENDING)
                .filter(c -> LocalDateTime.now().isBefore(c.getExpiresAt()));
    }

    /** Bo'shliqlar olib tashlanadi; eski 10 belgili kodlar ham (muddati tugaguncha) qabul qilinadi. */
    static String normalizeInviteCode(String raw) {
        if (raw == null) return null;
        String code = raw.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
        return code.matches("[A-Z0-9]{4,16}") ? code : null;
    }

    /** Muddati o'tgan takliflar kodlarini bo'shatadi (4 xonali kod maydoni cheklangan). */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 10 * 60 * 1000L, initialDelay = 60 * 1000L)
    @Transactional
    public void expireStaleInvites() {
        int expired = challengeRepository.expirePendingBefore(LocalDateTime.now(),
                OctagonChallengeStatus.PENDING, OctagonChallengeStatus.EXPIRED);
        if (expired > 0) log.debug("Expired {} stale Octagon invites", expired);
    }

    /** Havola/kod orqali duel boshlandi — taklif qayta ishlatilmasin. */
    @Transactional
    public void markInviteAccepted(UUID challengeId) {
        challengeRepository.findById(challengeId).ifPresent(c -> {
            c.setStatus(OctagonChallengeStatus.ACCEPTED);
            challengeRepository.save(c);
        });
    }

    @Transactional
    public OctagonMatch recordMatchResult(UUID matchId, String p1Id, String p2Id, int p1Score, int p2Score,
                                          List<Long> questionIds, int durationSec, OctagonGameType gameType) {
        return recordMatchResult(matchId, p1Id, p2Id, p1Score, p2Score, questionIds, durationSec, gameType, null);
    }

    /**
     * Jang natijasini yozadi. {@code forfeitUserId} berilsa (jangni tashlab ketgan o'yinchi), u
     * hisobidan qat'i nazar mag'lub, raqibi esa g'olib hisoblanadi.
     */
    @Transactional
    public OctagonMatch recordMatchResult(UUID matchId, String p1Id, String p2Id, int p1Score, int p2Score,
                                          List<Long> questionIds, int durationSec, OctagonGameType gameType,
                                          String forfeitUserId) {
        // Bir jang ikki marta hisoblanmasin (masalan, timeout va oxirgi javob bir vaqtda kelsa).
        if (matchId != null) {
            Optional<OctagonMatch> existing = matchRepository.findById(matchId);
            if (existing.isPresent()) {
                log.warn("Octagon match {} already recorded — skipping duplicate ELO update", matchId);
                return existing.get();
            }
        }

        OctagonProfile p1 = getOrCreateProfile(p1Id);
        OctagonProfile p2 = getOrCreateProfile(p2Id);

        // outcome: >0 — P1 yutdi, <0 — P2 yutdi, 0 — durang
        int outcome;
        if (forfeitUserId != null && forfeitUserId.equals(p1Id)) outcome = -1;
        else if (forfeitUserId != null && forfeitUserId.equals(p2Id)) outcome = 1;
        else outcome = Integer.compare(p1Score, p2Score);

        // ELO kalkulyatori natijani hisobga qarab aniqlaydi — forfeit uchun shartli hisob beramiz.
        int eloP1Score = outcome > 0 ? 1 : 0;
        int eloP2Score = outcome < 0 ? 1 : 0;
        OctagonEloCalculator.EloResult eloRes = eloCalculator.calculate(p1, p2, eloP1Score, eloP2Score);

        applyOutcome(p1, eloRes.p1NewElo, outcome);
        profileRepository.save(p1);

        if (!isBotId(p2Id)) {
            applyOutcome(p2, eloRes.p2NewElo, -outcome);
            profileRepository.save(p2);
        }

        String qIdsString = questionIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String winnerId = outcome > 0 ? p1Id : (outcome < 0 ? p2Id : null);

        OctagonMatch match = OctagonMatch.builder()
                .id(matchId != null ? matchId : UUID.randomUUID())
                .player1Id(p1Id)
                .player2Id(p2Id)
                .player1Score(p1Score)
                .player2Score(p2Score)
                .winnerId(winnerId)
                .isDraw(outcome == 0)
                .gameType(gameType)
                .status(OctagonMatchStatus.FINISHED)
                .questionIds(qIdsString)
                .durationSeconds(durationSec)
                .p1EloChange(eloRes.p1Delta)
                .p2EloChange(isBotId(p2Id) ? 0 : eloRes.p2Delta)
                .createdAt(LocalDateTime.now())
                .build();

        return matchRepository.save(match);
    }

    private static void applyOutcome(OctagonProfile p, int newElo, int outcome) {
        p.setEloRating(newElo);
        p.setRank(OctagonRank.fromElo(newElo));
        p.setTotalMatches(p.getTotalMatches() + 1);
        if (outcome > 0) {
            p.setWins(p.getWins() + 1);
            p.setWinStreak(p.getWinStreak() + 1);
            p.setMaxWinStreak(Math.max(p.getMaxWinStreak(), p.getWinStreak()));
        } else if (outcome < 0) {
            p.setLosses(p.getLosses() + 1);
            p.setWinStreak(0);
        } else {
            p.setDraws(p.getDraws() + 1);
        }
        p.setUpdatedAt(LocalDateTime.now());
    }

    /**
     * Tasodifiy faol savollar. Bazada savol bo'lmasa bo'sh ro'yxat qaytaradi — avvalgi
     * "1..10" soxta ID'lar fallback'i mavjud bo'lmagan savollar bilan jang ochardi.
     */
    public List<Long> getRandomQuestionIds(int count) {
        try {
            List<Long> ids = questionRepository.findRandomQuestionIds(PageRequest.of(0, count));
            if (ids != null) {
                return ids;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch random question IDs via questionRepository: {}", e.getMessage());
        }
        return List.of();
    }

    public String resolveDisplayName(String userId) {
        if (userId == null || userId.isBlank()) {
            return "Mehmon";
        }
        if (isBotId(userId)) {
            return OctagonBotPersonas.nameFor(userId);
        }
        if (OctagonGuestIdentity.isGuestId(userId)) {
            String shortCode = userId.length() > 10 ? userId.substring(6, 10).toUpperCase() : userId;
            return "Mehmon #" + shortCode;
        }
        try {
            Long uid = Long.parseLong(userId);
            Optional<User> uOpt = userRepository.findById(uid);
            if (uOpt.isPresent()) {
                return shortName(uOpt.get());
            }
        } catch (NumberFormatException ignored) {}

        return "Foydalanuvchi";
    }

    /** O'yinchi rasmi (Google/Telegram profili); yo'q yoki xavfsiz bo'lmasa — null (klient bosh harfli avatar chizadi). */
    public String resolveAvatarUrl(String userId) {
        if (userId == null || isBotId(userId) || OctagonGuestIdentity.isGuestId(userId)) return null;
        try {
            return userRepository.findById(Long.parseLong(userId)).map(u -> safeAvatarUrl(u.getProfileImageUrl())).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static String safeAvatarUrl(String raw) {
        if (raw == null) return null;
        String url = raw.strip();
        if (url.isEmpty() || url.length() > 1024 || url.chars().anyMatch(ch -> ch < 0x20 || ch == '"' || ch == '<' || ch == '>')) {
            return null;
        }
        if (url.startsWith("https://") || url.startsWith("/api/v1/files/") || url.startsWith("/api/v1/public/avatars/")) return url;
        return null;
    }

    /** Ko'p foydalanuvchi ismini bitta so'rov bilan aniqlaydi. */
    public Map<String, String> resolveDisplayNames(Collection<String> userIds) {
        Map<String, String> result = new HashMap<>();
        List<Long> numeric = new ArrayList<>();
        for (String id : userIds) {
            if (id == null) continue;
            try {
                numeric.add(Long.parseLong(id));
            } catch (NumberFormatException e) {
                result.put(id, resolveDisplayName(id));
            }
        }
        if (!numeric.isEmpty()) {
            for (User u : userRepository.findAllById(numeric)) {
                result.put(String.valueOf(u.getId()), shortName(u));
            }
        }
        return result;
    }

    /** Ko'p foydalanuvchi rasmini bitta so'rov bilan aniqlaydi (rasmsizlar xaritada bo'lmaydi). */
    public Map<String, String> resolveAvatarUrls(Collection<String> userIds) {
        List<Long> numeric = new ArrayList<>();
        for (String id : userIds) {
            if (id == null) continue;
            try {
                numeric.add(Long.parseLong(id));
            } catch (NumberFormatException ignored) {
                // bot/mehmon — rasm yo'q
            }
        }
        Map<String, String> result = new HashMap<>();
        if (!numeric.isEmpty()) {
            for (User u : userRepository.findAllById(numeric)) {
                String avatar = safeAvatarUrl(u.getProfileImageUrl());
                if (avatar != null) result.put(String.valueOf(u.getId()), avatar);
            }
        }
        return result;
    }

    /**
     * Ekranda ko'rinadigan ism: "Ism F." → niqoblangan telefon ("+998 90 *** ** 12") → "Haydovchi #ID".
     * Hech qachon null, bo'sh yoki "null"/"undefined" qaytarmaydi.
     */
    static String shortName(User u) {
        String first = cleanNamePart(u.getFirstName());
        String last = cleanNamePart(u.getLastName());
        if (first != null) {
            return last != null ? first + " " + last.charAt(0) + "." : first;
        }
        if (last != null) {
            return last;
        }
        String masked = maskPhone(u.getPhoneNumber());
        if (masked != null) {
            return masked;
        }
        return "Haydovchi #" + (u.getId() != null ? u.getId() : "");
    }

    private static String cleanNamePart(String raw) {
        if (raw == null) return null;
        String s = raw.replaceAll("[\\p{Cntrl}<>\"`]", "").strip();
        if (s.isEmpty() || s.equalsIgnoreCase("null") || s.equalsIgnoreCase("undefined")) return null;
        return s.length() > 32 ? s.substring(0, 32).strip() : s;
    }

    /** "+998901234512" → "+998 90 *** ** 12"; boshqa formatlar uchun oxirgi 2 raqam qoladi. */
    static String maskPhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("998")) {
            return "+998 " + digits.substring(3, 5) + " *** ** " + digits.substring(10);
        }
        if (digits.length() == 9) {
            return "+998 " + digits.substring(0, 2) + " *** ** " + digits.substring(7);
        }
        if (digits.length() >= 6) {
            return "+" + digits.substring(0, Math.min(3, digits.length() - 4)) + " *** ** " + digits.substring(digits.length() - 2);
        }
        return null;
    }

    /**
     * 4 raqamli bo'sh kod: faol taklif egallagan kod tashlab ketiladi (25 martagacha), muddati o'tgan
     * lekin hali PENDING turgan taklif kodi esa shu yerda bo'shatiladi.
     */
    String generateInviteCode(LocalDateTime now) {
        for (int attempt = 0; attempt < INVITE_CODE_ATTEMPTS; attempt++) {
            String code = String.valueOf(INVITE_CODE_MIN + RANDOM.nextInt(INVITE_CODE_SPAN));
            Optional<OctagonChallenge> holder =
                    challengeRepository.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(code, OctagonChallengeStatus.PENDING);
            if (holder.isEmpty()) return code;
            OctagonChallenge stale = holder.get();
            if (!now.isBefore(stale.getExpiresAt())) {
                stale.setStatus(OctagonChallengeStatus.EXPIRED);
                challengeRepository.saveAndFlush(stale);
                return code;
            }
        }
        throw new RateLimitExceededException("Hozir bo'sh taklif kodi yo'q. Birozdan keyin qayta urinib ko'ring");
    }

    /**
     * Savol matni/variantlari/rasmi — to'g'ri javob ham, izoh ham YO'Q (izoh ko'pincha javobni aytadi).
     */
    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByIds(List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) return Collections.emptyList();
        List<Long> ids = questionIds.stream().filter(Objects::nonNull).distinct().limit(MAX_QUESTIONS_PER_REQUEST).toList();
        List<Question> questions = questionRepository.findAllById(ids);
        Map<Long, Question> qMap = questions.stream().collect(Collectors.toMap(Question::getId, q -> q));

        List<QuestionDto> dtos = new ArrayList<>();
        for (Long id : ids) {
            Question q = qMap.get(id);
            if (q == null) continue;

            List<QuestionOptionDto> opts = new ArrayList<>();
            if (q.getOptions() != null) {
                for (QuestionOption o : q.getOptions()) {
                    opts.add(QuestionOptionDto.builder()
                            .index(o.getOptionIndex() != null ? o.getOptionIndex() : 0)
                            .textUzl(o.getTextUzl())
                            .textUzc(o.getTextUzc())
                            .textRu(o.getTextRu())
                            .build());
                }
                opts.sort(Comparator.comparingInt(QuestionOptionDto::getIndex));
            }

            dtos.add(QuestionDto.builder()
                    .id(q.getId())
                    .textUzl(q.getTextUzl())
                    .textUzc(q.getTextUzc())
                    .textRu(q.getTextRu())
                    .imageUrl(q.getImageUrl())
                    .options(opts)
                    .build());
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<UserSearchResult> searchUsers(String query, String currentUserId) {
        if (query == null || query.trim().length() < 2 || query.trim().length() > 64) {
            return Collections.emptyList();
        }
        String cleanQuery = query.trim();
        List<User> foundUsers = new ArrayList<>();

        if (cleanQuery.matches("\\d{1,18}")) {
            userRepository.findById(Long.parseLong(cleanQuery))
                    .filter(u -> !Boolean.TRUE.equals(u.getDeleted()) && !Boolean.FALSE.equals(u.getIsActive()))
                    .ifPresent(foundUsers::add);
        } else {
            String escaped = cleanQuery.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
            try {
                Page<User> page = userRepository.searchActiveUsersByName(escaped, PageRequest.of(0, 10));
                foundUsers.addAll(page.getContent());
            } catch (Exception e) {
                log.warn("Search users error: {}", e.getMessage());
            }
        }

        List<UserSearchResult> results = new ArrayList<>();
        for (User u : foundUsers) {
            String uidStr = String.valueOf(u.getId());
            if (uidStr.equals(currentUserId)) {
                continue;
            }

            OctagonProfile profile = getProfileSnapshot(uidStr);
            results.add(UserSearchResult.builder()
                    .userId(uidStr)
                    .displayName(shortName(u))
                    .avatarUrl(safeAvatarUrl(u.getProfileImageUrl()))
                    .eloRating(profile.getEloRating())
                    .rank(OctagonRank.fromElo(profile.getEloRating()))
                    .rankEmoji(OctagonRank.fromElo(profile.getEloRating()).getEmoji())
                    .rankName(OctagonRank.fromElo(profile.getEloRating()).getDisplayName())
                    .wins(profile.getWins())
                    .totalMatches(profile.getTotalMatches())
                    .isOnline(false)
                    .status("OFFLINE")
                    .build());
        }

        return results;
    }

    @Transactional
    public void submitReport(String reporterId, ReportRequest request) {
        if (request == null || request.getReportedUserId() == null || request.getReportedUserId().isBlank()
                || request.getReportedUserId().length() > 64) {
            throw new ValidationException("reportedUserId majburiy");
        }
        if (request.getReportedUserId().equals(reporterId)) {
            throw new ValidationException("O'zingiz ustingizdan shikoyat qila olmaysiz");
        }

        // Shikoyat spami: bir foydalanuvchi soatiga ko'pi bilan 5 ta
        Instant now = Instant.now();
        Deque<Instant> times = reportTimes.computeIfAbsent(reporterId, k -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(now.minusSeconds(3600))) times.pollFirst();
            if (times.size() >= MAX_REPORTS_PER_HOUR) {
                throw new RateLimitExceededException("Shikoyatlar soni chegaradan oshdi, keyinroq urinib ko'ring");
            }
            times.addLast(now);
        }

        // matchId haqiqiy jang bo'lsa, ikkala tomon ham shu jang ishtirokchisi bo'lishi shart
        String matchId = request.getMatchId();
        if (matchId != null && !matchId.isBlank()) {
            try {
                Optional<OctagonMatch> m = matchRepository.findById(UUID.fromString(matchId));
                if (m.isPresent()) {
                    Set<String> players = Set.of(m.get().getPlayer1Id(), m.get().getPlayer2Id());
                    if (!players.contains(reporterId) || !players.contains(request.getReportedUserId())) {
                        throw new ForbiddenException("Siz bu jang ishtirokchisi emassiz");
                    }
                }
            } catch (IllegalArgumentException notUuid) {
                // eski klientlar / guruh xonasi — matchId tekshirib bo'lmaydi
            }
        }

        String reason = request.getReason() != null && REPORT_REASONS.contains(request.getReason().toUpperCase())
                ? request.getReason().toUpperCase() : "OTHER";
        String comment = request.getComment();
        if (comment != null) {
            comment = comment.strip();
            if (comment.length() > 500) comment = comment.substring(0, 500);
        }

        log.warn("[OCTAGON_SECURITY_AUDIT] User {} reported {} in match {}. Reason: {}",
                reporterId, request.getReportedUserId(), matchId, reason);

        OctagonReport report = OctagonReport.builder()
                .matchId(matchId != null && matchId.length() > 64 ? matchId.substring(0, 64) : matchId)
                .reporterId(reporterId)
                .reportedUserId(request.getReportedUserId())
                .reason(reason)
                .comment(comment)
                .createdAt(LocalDateTime.now())
                .build();

        reportRepository.save(report);
    }
}
