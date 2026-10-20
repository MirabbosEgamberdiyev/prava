package uz.pravaimtihon.octagon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.UnauthorizedException;
import uz.pravaimtihon.octagon.dto.OctagonDtos.*;
import uz.pravaimtihon.octagon.service.OctagonGuestIdentity;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.octagon.service.OctagonTicketService;
import uz.pravaimtihon.octagon.websocket.OctagonMatchmaker;
import uz.pravaimtihon.security.CustomUserDetails;

import java.util.List;

/**
 * Oktagon REST API. Butun prefiks permitAll (mehmon rejimi), shuning uchun har bir endpoint chaqiruvchini
 * o'zi aniqlaydi: JWT bo'lsa — foydalanuvchi, aks holda faqat server imzolagan mehmon tokeni
 * ({@link OctagonGuestIdentity}). Klient yuborgan ixtiyoriy {@code guestId}/{@code reporterId} endi
 * identifikatsiya sifatida qabul qilinmaydi.
 */
@RestController
@RequestMapping({"/api/app/octagon", "/api/v1/octagon"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Octagon 1v1 PvP API", description = "Real-time intellectual battle endpoints")
public class OctagonController {

    private final OctagonTicketService ticketService;
    private final OctagonService octagonService;
    private final OctagonMatchmaker matchmaker;
    private final OctagonGuestIdentity guestIdentity;

    /** JWT foydalanuvchisi yoki imzolangan mehmon tokeni egasi; aniqlanmasa null. */
    private String resolveCaller(CustomUserDetails principal, String guestToken) {
        if (principal != null) return principal.getId().toString();
        return guestIdentity.verifyToken(guestToken);
    }

    private String requireCaller(CustomUserDetails principal, String guestToken) {
        String id = resolveCaller(principal, guestToken);
        if (id == null) throw new UnauthorizedException("Oktagon uchun tizimga kiring yoki mehmon sifatida qayta ulaning");
        return id;
    }

    static String sanitizeGuestName(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replaceAll("[\\p{Cntrl}<>\"'`]", "").strip();
        if (cleaned.length() > 24) cleaned = cleaned.substring(0, 24).strip();
        return cleaned.isEmpty() ? null : cleaned;
    }

    @PostMapping("/ticket")
    @Operation(summary = "Generate 30-second One-Time Ticket for WebSocket authentication (CWE-598 protected)")
    public ResponseEntity<ApiResponse<TicketResponse>> getOneTimeTicket(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "guestId", required = false) String guestId,
            @RequestParam(value = "displayName", required = false) String guestDisplayName) {

        String userId;
        String name;
        String guestToken = null;

        if (principal != null) {
            userId = principal.getId().toString();
            name = octagonService.resolveDisplayName(userId);
        } else {
            // Mehmon: faqat server imzolagan token qayta ishlatiladi, aks holda yangi mehmon identifikatori beriladi
            userId = guestIdentity.verifyToken(guestId);
            guestToken = guestId;
            if (userId == null) {
                guestToken = guestIdentity.issueToken();
                userId = guestIdentity.verifyToken(guestToken);
            }
            String nick = sanitizeGuestName(guestDisplayName);
            name = nick != null ? nick : octagonService.resolveDisplayName(userId);
        }

        String ticket = ticketService.createTicket(userId, name);
        TicketResponse res = TicketResponse.builder()
                .ticket(ticket)
                .expiresInSeconds(OctagonTicketService.TICKET_TTL_SECONDS)
                .guestId(guestToken)
                .userId(userId)
                .build();

        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get user ELO, rank and combat statistics (public profile card)")
    public ResponseEntity<ApiResponse<StatsResponse>> getStats(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "userId", required = false) String queryUserId) {

        String effectiveId;
        if (queryUserId != null && !queryUserId.isBlank()) {
            // Mehmon o'z tokenini yuborsa — o'z statistikasi; aks holda ochiq profil kartasi (leaderboard'dagi kabi)
            String fromToken = guestIdentity.verifyToken(queryUserId);
            effectiveId = fromToken != null ? fromToken : queryUserId.trim();
            if (effectiveId.length() > 64) effectiveId = effectiveId.substring(0, 64);
        } else if (principal != null) {
            effectiveId = principal.getId().toString();
        } else {
            effectiveId = "guest_default";
        }

        StatsResponse stats = octagonService.getStats(effectiveId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Get Octagon Leaderboard (weekly, monthly, all_time)")
    public ResponseEntity<ApiResponse<List<LeaderboardEntry>>> getLeaderboard(
            @RequestParam(value = "period", defaultValue = "all_time") String period) {

        List<LeaderboardEntry> list = octagonService.getLeaderboard(period);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/history")
    @Operation(summary = "Get the caller's own match history")
    public ResponseEntity<ApiResponse<Page<MatchHistoryEntry>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "userId", required = false) String queryUserId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        // Faqat o'z tarixi (avval ?userId= bilan har kimning raqiblari va natijalarini ko'rish mumkin edi)
        String caller = resolveCaller(principal, queryUserId);
        if (caller == null) {
            return ResponseEntity.ok(ApiResponse.success(new PageImpl<>(List.of(), PageRequest.of(0, 1), 0)));
        }

        Page<MatchHistoryEntry> history = octagonService.getUserHistory(caller, page, size);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/challenge/create")
    @Operation(summary = "Create duel invite link for friends")
    public ResponseEntity<ApiResponse<ChallengeResponse>> createChallenge(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "guestId", required = false) String guestId,
            @RequestParam(value = "targetUserId", required = false) String targetUserId) {

        String challengerId = requireCaller(principal, guestId);
        String target = targetUserId != null && !targetUserId.isBlank() && targetUserId.length() <= 64 ? targetUserId : null;
        ChallengeResponse response = octagonService.createChallenge(challengerId, target);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/challenge/{code}")
    @Operation(summary = "Get duel invite details by code")
    public ResponseEntity<ApiResponse<ChallengeResponse>> getChallenge(
            @PathVariable("code") String code) {

        return octagonService.getChallenge(code)
                .map(c -> {
                    ChallengeResponse res = ChallengeResponse.builder()
                            .challengeId(c.getId())
                            .inviteCode(c.getInviteCode())
                            .inviteUrl("https://pravaonline.uz/octagon?duel=" + c.getInviteCode())
                            .challengerId(c.getChallengerId())
                            .challengerName(octagonService.resolveDisplayName(c.getChallengerId()))
                            .expiresAt(c.getExpiresAt())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success(res));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Duel taklifi topilmadi yoki muddati o'tgan")));
    }

    @PostMapping("/questions")
    @Operation(summary = "Get question details of an ACTIVE match/room (no correct answers, no explanations)")
    public ResponseEntity<ApiResponse<List<QuestionDto>>> getQuestions(
            @RequestBody List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        if (questionIds.size() > OctagonService.MAX_QUESTIONS_PER_REQUEST
                || !matchmaker.areQuestionsInActiveGame(questionIds)) {
            // Ixtiyoriy ID'lar bilan butun (shu jumladan pullik) savollar bazasini yig'ib olishning oldini olish
            throw new ForbiddenException("Bu savollar faol jangga tegishli emas");
        }
        List<QuestionDto> list = octagonService.getQuestionsByIds(questionIds);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/users/search")
    @Operation(summary = "Search players by name or exact ID (authenticated users only)")
    public ResponseEntity<ApiResponse<List<UserSearchResult>>> searchUsers(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam("q") String query) {

        // Avval anonim so'rov telefon/e-mail bo'yicha ism va avatarni qaytarardi (PII enumeratsiyasi)
        if (principal == null) {
            throw new UnauthorizedException("Qidiruv uchun tizimga kiring");
        }
        String currentUserId = principal.getId().toString();
        List<UserSearchResult> results = octagonService.searchUsers(query, currentUserId);

        for (UserSearchResult r : results) {
            r.setOnline(matchmaker.isUserOnline(r.getUserId()));
            r.setStatus(matchmaker.getUserStatus(r.getUserId()));
        }

        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/room/{code}")
    @Operation(summary = "Get group room details by code")
    public ResponseEntity<ApiResponse<GroupRoomDto>> getRoom(
            @PathVariable("code") String code) {

        return matchmaker.getRoomDto(code)
                .map(room -> ResponseEntity.ok(ApiResponse.success(room)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Xona topilmadi")));
    }

    @PostMapping("/report")
    @Operation(summary = "Submit abuse report or complaint against a player")
    public ResponseEntity<ApiResponse<String>> submitReport(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "reporterId", required = false) String guestReporterToken,
            @RequestBody ReportRequest request) {

        String reporterId = requireCaller(principal, guestReporterToken);
        octagonService.submitReport(reporterId, request);
        return ResponseEntity.ok(ApiResponse.success("Shikoyat qabul qilindi"));
    }
}
