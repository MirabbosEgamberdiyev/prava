package uz.pravaimtihon.octagon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.exception.UnauthorizedException;
import uz.pravaimtihon.octagon.dto.OctagonDtos.*;
import uz.pravaimtihon.octagon.service.OctagonCodeGuard;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.octagon.service.OctagonTicketService;
import uz.pravaimtihon.octagon.websocket.OctagonMatchmaker;
import uz.pravaimtihon.security.CustomUserDetails;

import java.util.List;

/**
 * Oktagon REST API. Butun prefiks permitAll (reyting va liga ma'lumotlari ochiq), lekin jang qilish,
 * duel taklifi, tarix va shikoyat FAQAT ro'yxatdan o'tgan foydalanuvchilar uchun: JWT bo'lmasa 401.
 * Mehmon rejimi (imzolangan mehmon tokeni) 2026-10-21 dan yopilgan — ELO va ligalar faqat haqiqiy
 * akkauntlarga yoziladi. Klient yuborgan {@code guestId}/{@code reporterId} parametrlari e'tiborga olinmaydi.
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
    private final OctagonCodeGuard codeGuard;

    static final String LOGIN_REQUIRED = "Oktagon janglarida qatnashish uchun tizimga kiring";

    /** Faqat JWT foydalanuvchisi; mehmon bo'lsa null. */
    private static String resolveCaller(CustomUserDetails principal) {
        return principal != null ? principal.getId().toString() : null;
    }

    private static String requireCaller(CustomUserDetails principal) {
        String id = resolveCaller(principal);
        if (id == null) throw new UnauthorizedException(LOGIN_REQUIRED);
        return id;
    }

    @PostMapping("/ticket")
    @Operation(summary = "Generate 30-second One-Time Ticket for WebSocket authentication (CWE-598 protected)")
    public ResponseEntity<ApiResponse<TicketResponse>> getOneTimeTicket(
            @AuthenticationPrincipal CustomUserDetails principal) {

        // Majburiy avtorizatsiya: mehmonlarga ticket berilmaydi (eski klientlarning guestId/displayName
        // parametrlari e'tiborga olinmaydi; ism serverda aniqlanadi)
        String userId = requireCaller(principal);
        String name = octagonService.resolveDisplayName(userId);

        String ticket = ticketService.createTicket(userId, name);
        TicketResponse res = TicketResponse.builder()
                .ticket(ticket)
                .expiresInSeconds(OctagonTicketService.TICKET_TTL_SECONDS)
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
        if (queryUserId != null && !queryUserId.isBlank() && !queryUserId.startsWith("g1.")) {
            // Ochiq profil kartasi (leaderboard'dagi kabi); eski mehmon tokenlari endi identifikatsiya emas
            effectiveId = queryUserId.trim();
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
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        // Faqat o'z tarixi (avval ?userId= bilan har kimning raqiblari va natijalarini ko'rish mumkin edi)
        String caller = resolveCaller(principal);
        if (caller == null) {
            return ResponseEntity.ok(ApiResponse.success(new PageImpl<>(List.of(), PageRequest.of(0, 1), 0)));
        }

        Page<MatchHistoryEntry> history = octagonService.getUserHistory(caller, page, size);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /** Bir vaqtda ikki foydalanuvchi bir xil 4 xonali kodni tanlasa, saqlash rad etiladi — yangi kod bilan qayta. */
    static final int CREATE_INVITE_ATTEMPTS = 3;

    @PostMapping("/challenge/create")
    @Operation(summary = "Create a 4-digit duel invite code and share link for friends")
    public ResponseEntity<ApiResponse<ChallengeResponse>> createChallenge(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "targetUserId", required = false) String targetUserId) {

        String challengerId = requireCaller(principal);
        String target = targetUserId != null && !targetUserId.isBlank() && targetUserId.length() <= 64 ? targetUserId : null;
        for (int attempt = 1; ; attempt++) {
            try {
                ChallengeResponse response = octagonService.createChallenge(challengerId, target);
                return ResponseEntity.ok(ApiResponse.success(response));
            } catch (DataIntegrityViolationException e) {
                if (attempt >= CREATE_INVITE_ATTEMPTS) throw e;
                log.debug("Invite code collision, retrying ({}/{})", attempt, CREATE_INVITE_ATTEMPTS);
            }
        }
    }

    /**
     * Kod bo'yicha taklif ma'lumoti. 4 xonali kodlarni ketma-ket tekshirib, faol takliflar va ularning
     * egalarini yig'ib olishning oldini olish uchun faqat tizimga kirganlarga va noto'g'ri urinishlar limiti bilan.
     */
    @GetMapping("/challenge/{code}")
    @Operation(summary = "Get duel invite details by code (authenticated, brute-force limited)")
    public ResponseEntity<ApiResponse<ChallengeResponse>> getChallenge(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("code") String code) {

        String caller = requireCaller(principal);
        if (codeGuard.isBlocked(caller)) {
            throw new RateLimitExceededException("Juda ko'p noto'g'ri kod kiritildi. 1 daqiqadan so'ng qayta urinib ko'ring");
        }
        return octagonService.getChallenge(code)
                .map(c -> {
                    ChallengeResponse res = ChallengeResponse.builder()
                            .challengeId(c.getId())
                            .inviteCode(c.getInviteCode())
                            .inviteUrl(OctagonService.inviteUrl(c.getInviteCode()))
                            .challengerId(c.getChallengerId())
                            .challengerName(octagonService.resolveDisplayName(c.getChallengerId()))
                            .expiresAt(c.getExpiresAt())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success(res));
                })
                .orElseGet(() -> {
                    codeGuard.recordFailure(caller);
                    return ResponseEntity.status(404).body(ApiResponse.error("Bunday kod topilmadi yoki muddati o'tgan"));
                });
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
    @Operation(summary = "Get group room details by code (authenticated, brute-force limited)")
    public ResponseEntity<ApiResponse<GroupRoomDto>> getRoom(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("code") String code) {

        String caller = requireCaller(principal);
        if (codeGuard.isBlocked(caller)) {
            throw new RateLimitExceededException("Juda ko'p urinish, birozdan keyin qayta urinib ko'ring");
        }
        return matchmaker.getRoomDto(code)
                .map(room -> ResponseEntity.ok(ApiResponse.success(room)))
                .orElseGet(() -> {
                    codeGuard.recordFailure(caller);
                    return ResponseEntity.status(404).body(ApiResponse.error("Xona topilmadi"));
                });
    }

    @PostMapping("/report")
    @Operation(summary = "Submit abuse report or complaint against a player")
    public ResponseEntity<ApiResponse<String>> submitReport(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody ReportRequest request) {

        String reporterId = requireCaller(principal);
        octagonService.submitReport(reporterId, request);
        return ResponseEntity.ok(ApiResponse.success("Shikoyat qabul qilindi"));
    }
}
