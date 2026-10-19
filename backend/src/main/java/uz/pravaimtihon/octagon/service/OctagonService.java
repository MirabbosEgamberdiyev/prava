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

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OctagonService {

    private final OctagonProfileRepository profileRepository;
    private final OctagonMatchRepository matchRepository;
    private final OctagonChallengeRepository challengeRepository;
    private final OctagonReportRepository reportRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final OctagonEloCalculator eloCalculator;

    @Transactional
    public OctagonProfile getOrCreateProfile(String userId) {
        return profileRepository.findById(userId).orElseGet(() -> {
            OctagonProfile profile = OctagonProfile.builder()
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
            return profileRepository.save(profile);
        });
    }

    @Transactional(readOnly = true)
    public StatsResponse getStats(String userId) {
        OctagonProfile profile = getOrCreateProfile(userId);
        String displayName = resolveDisplayName(userId);

        double winRate = profile.getTotalMatches() > 0
                ? ((double) profile.getWins() / profile.getTotalMatches()) * 100.0
                : 0.0;

        return StatsResponse.builder()
                .userId(userId)
                .displayName(displayName)
                .eloRating(profile.getEloRating())
                .rank(profile.getRank())
                .rankEmoji(profile.getRank().getEmoji())
                .rankName(profile.getRank().getDisplayName())
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

        List<LeaderboardEntry> result = new ArrayList<>();
        int position = 1;
        for (OctagonProfile p : profiles) {
            double winRate = p.getTotalMatches() > 0
                    ? ((double) p.getWins() / p.getTotalMatches()) * 100.0
                    : 0.0;

            result.add(LeaderboardEntry.builder()
                    .position(position++)
                    .userId(p.getUserId())
                    .displayName(resolveDisplayName(p.getUserId()))
                    .eloRating(p.getEloRating())
                    .rank(p.getRank())
                    .rankEmoji(p.getRank().getEmoji())
                    .wins(p.getWins())
                    .totalMatches(p.getTotalMatches())
                    .winRate(Math.round(winRate * 10.0) / 10.0)
                    .build());
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Page<MatchHistoryEntry> getUserHistory(String userId, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(50, Math.max(1, size)));
        Page<OctagonMatch> matches = matchRepository.findUserMatches(userId, pr);

        return matches.map(m -> {
            boolean isP1 = userId.equals(m.getPlayer1Id());
            String oppId = isP1 ? m.getPlayer2Id() : m.getPlayer1Id();
            int myScore = isP1 ? m.getPlayer1Score() : m.getPlayer2Score();
            int oppScore = isP1 ? m.getPlayer2Score() : m.getPlayer1Score();
            int myDelta = isP1 ? m.getP1EloChange() : m.getP2EloChange();

            String outcome;
            if (m.getIsDraw()) {
                outcome = "DRAW";
            } else if (userId.equals(m.getWinnerId())) {
                outcome = "WIN";
            } else {
                outcome = "LOSS";
            }

            return MatchHistoryEntry.builder()
                    .matchId(m.getId())
                    .opponentId(oppId)
                    .opponentName(resolveDisplayName(oppId))
                    .myScore(myScore)
                    .opponentScore(oppScore)
                    .result(outcome)
                    .deltaElo(myDelta)
                    .durationSeconds(m.getDurationSeconds())
                    .createdAt(m.getCreatedAt())
                    .build();
        });
    }

    @Transactional
    public ChallengeResponse createChallenge(String challengerId, String targetUserId) {
        String code = generateInviteCode();
        UUID challengeId = UUID.randomUUID();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        OctagonChallenge challenge = OctagonChallenge.builder()
                .id(challengeId)
                .challengerId(challengerId)
                .targetUserId(targetUserId)
                .inviteCode(code)
                .status(OctagonChallengeStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .build();

        challengeRepository.save(challenge);

        return ChallengeResponse.builder()
                .challengeId(challengeId)
                .inviteCode(code)
                .inviteUrl("https://pravaonline.uz/octagon?duel=" + code)
                .challengerId(challengerId)
                .challengerName(resolveDisplayName(challengerId))
                .expiresAt(expiresAt)
                .build();
    }

    @Transactional(readOnly = true)
    public Optional<OctagonChallenge> getChallenge(String inviteCode) {
        return challengeRepository.findByInviteCode(inviteCode)
                .filter(c -> c.getStatus() == OctagonChallengeStatus.PENDING && LocalDateTime.now().isBefore(c.getExpiresAt()));
    }

    @Transactional
    public OctagonMatch recordMatchResult(UUID matchId, String p1Id, String p2Id, int p1Score, int p2Score,
                                          List<Long> questionIds, int durationSec, OctagonGameType gameType) {
        OctagonProfile p1 = getOrCreateProfile(p1Id);
        OctagonProfile p2 = getOrCreateProfile(p2Id);

        OctagonEloCalculator.EloResult eloRes = eloCalculator.calculate(p1, p2, p1Score, p2Score);

        // Update P1 Profile
        p1.setEloRating(eloRes.p1NewElo);
        p1.setRank(OctagonRank.fromElo(eloRes.p1NewElo));
        p1.setTotalMatches(p1.getTotalMatches() + 1);
        if (p1Score > p2Score) {
            p1.setWins(p1.getWins() + 1);
            p1.setWinStreak(p1.getWinStreak() + 1);
            p1.setMaxWinStreak(Math.max(p1.getMaxWinStreak(), p1.getWinStreak()));
        } else if (p1Score < p2Score) {
            p1.setLosses(p1.getLosses() + 1);
            p1.setWinStreak(0);
        } else {
            p1.setDraws(p1.getDraws() + 1);
        }
        p1.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(p1);

        // Update P2 Profile (unless bot)
        if (!p2Id.startsWith("bot")) {
            p2.setEloRating(eloRes.p2NewElo);
            p2.setRank(OctagonRank.fromElo(eloRes.p2NewElo));
            p2.setTotalMatches(p2.getTotalMatches() + 1);
            if (p2Score > p1Score) {
                p2.setWins(p2.getWins() + 1);
                p2.setWinStreak(p2.getWinStreak() + 1);
                p2.setMaxWinStreak(Math.max(p2.getMaxWinStreak(), p2.getWinStreak()));
            } else if (p2Score < p1Score) {
                p2.setLosses(p2.getLosses() + 1);
                p2.setWinStreak(0);
            } else {
                p2.setDraws(p2.getDraws() + 1);
            }
            p2.setUpdatedAt(LocalDateTime.now());
            profileRepository.save(p2);
        }

        // Persist Match
        String qIdsString = questionIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        String winnerId = p1Score > p2Score ? p1Id : (p2Score > p1Score ? p2Id : null);
        boolean isDraw = (p1Score == p2Score);

        OctagonMatch match = OctagonMatch.builder()
                .id(matchId != null ? matchId : UUID.randomUUID())
                .player1Id(p1Id)
                .player2Id(p2Id)
                .player1Score(p1Score)
                .player2Score(p2Score)
                .winnerId(winnerId)
                .isDraw(isDraw)
                .gameType(gameType)
                .status(OctagonMatchStatus.FINISHED)
                .questionIds(qIdsString)
                .durationSeconds(durationSec)
                .p1EloChange(eloRes.p1Delta)
                .p2EloChange(eloRes.p2Delta)
                .createdAt(LocalDateTime.now())
                .build();

        return matchRepository.save(match);
    }

    public List<Long> getRandomQuestionIds(int count) {
        try {
            List<Long> ids = questionRepository.findRandomQuestionIds(PageRequest.of(0, count));
            if (ids != null && !ids.isEmpty()) {
                return ids;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch random question IDs via questionRepository: {}", e.getMessage());
        }
        // Fallback default sample IDs if DB has empty random or error
        return List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L);
    }

    public String resolveDisplayName(String userId) {
        if (userId == null || userId.isBlank()) {
            return "Mehmon";
        }
        if (userId.startsWith("bot")) {
            return "OctagonBot ⚡";
        }
        if (userId.startsWith("guest_")) {
            String shortCode = userId.length() > 10 ? userId.substring(6, 10).toUpperCase() : userId;
            return "Mehmon #" + shortCode;
        }
        try {
            Long uid = Long.parseLong(userId);
            Optional<User> uOpt = userRepository.findById(uid);
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                String name = u.getFirstName();
                if (u.getLastName() != null && !u.getLastName().isBlank()) {
                    name += " " + u.getLastName().charAt(0) + ".";
                }
                return name;
            }
        } catch (NumberFormatException ignored) {}

        return "Foydalanuvchi";
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByIds(List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) return Collections.emptyList();
        List<Question> questions = questionRepository.findAllById(questionIds);
        Map<Long, Question> qMap = questions.stream().collect(Collectors.toMap(Question::getId, q -> q));

        List<QuestionDto> dtos = new ArrayList<>();
        for (Long id : questionIds) {
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
            }

            dtos.add(QuestionDto.builder()
                    .id(q.getId())
                    .textUzl(q.getTextUzl())
                    .textUzc(q.getTextUzc())
                    .textRu(q.getTextRu())
                    .imageUrl(q.getImageUrl())
                    .options(opts)
                    .explanationUzl(q.getExplanationUzl())
                    .explanationUzc(q.getExplanationUzc())
                    .explanationRu(q.getExplanationRu())
                    .build());
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<UserSearchResult> searchUsers(String query, String currentUserId) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        String cleanQuery = query.trim();
        List<User> foundUsers = new ArrayList<>();

        try {
            Long uid = Long.parseLong(cleanQuery);
            userRepository.findById(uid).ifPresent(foundUsers::add);
        } catch (NumberFormatException ignored) {}

        try {
            Page<User> page = userRepository.searchUsers(cleanQuery, PageRequest.of(0, 10));
            for (User u : page.getContent()) {
                if (foundUsers.stream().noneMatch(existing -> existing.getId().equals(u.getId()))) {
                    foundUsers.add(u);
                }
            }
        } catch (Exception e) {
            log.warn("Search users error for query '{}': {}", cleanQuery, e.getMessage());
        }

        List<UserSearchResult> results = new ArrayList<>();
        for (User u : foundUsers) {
            String uidStr = String.valueOf(u.getId());
            if (uidStr.equals(currentUserId)) {
                continue;
            }

            OctagonProfile profile = getOrCreateProfile(uidStr);
            String name = u.getFirstName();
            if (u.getLastName() != null && !u.getLastName().isBlank()) {
                name += " " + u.getLastName().charAt(0) + ".";
            }

            results.add(UserSearchResult.builder()
                    .userId(uidStr)
                    .displayName(name)
                    .avatarUrl(u.getProfileImageUrl() != null ? u.getProfileImageUrl() : "/images/default-avatar.webp")
                    .eloRating(profile.getEloRating())
                    .rank(profile.getRank())
                    .rankEmoji(profile.getRank() != null ? profile.getRank().getEmoji() : "🥉")
                    .rankName(profile.getRank() != null ? profile.getRank().getDisplayName() : "Bronza")
                    .isOnline(false)
                    .status("OFFLINE")
                    .build());
        }

        return results;
    }

    @Transactional
    public void submitReport(String reporterId, ReportRequest request) {
        log.warn("[OCTAGON_SECURITY_AUDIT] User {} reported {} in match {}. Reason: {}, Comment: {}",
                reporterId, request.getReportedUserId(), request.getMatchId(), request.getReason(), request.getComment());

        OctagonReport report = OctagonReport.builder()
                .matchId(request.getMatchId())
                .reporterId(reporterId)
                .reportedUserId(request.getReportedUserId())
                .reason(request.getReason() != null ? request.getReason() : "OTHER")
                .comment(request.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        reportRepository.save(report);
    }
}

