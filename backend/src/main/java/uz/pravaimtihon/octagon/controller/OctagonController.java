package uz.pravaimtihon.octagon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.octagon.dto.OctagonDtos.*;
import uz.pravaimtihon.octagon.entity.OctagonChallenge;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.octagon.service.OctagonTicketService;
import uz.pravaimtihon.security.CustomUserDetails;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/app/octagon", "/api/v1/octagon"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Octagon 1v1 PvP API", description = "Real-time intellectual battle endpoints")
public class OctagonController {

    private final OctagonTicketService ticketService;
    private final OctagonService octagonService;
    private final uz.pravaimtihon.octagon.websocket.OctagonMatchmaker matchmaker;

    @PostMapping("/ticket")
    @Operation(summary = "Generate 30-second One-Time Ticket for WebSocket authentication (CWE-598 protected)")
    public ResponseEntity<ApiResponse<TicketResponse>> getOneTimeTicket(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "guestId", required = false) String guestId,
            @RequestParam(value = "displayName", required = false) String guestDisplayName) {

        String userId;
        String name;

        if (principal != null) {
            userId = principal.getId().toString();
            name = octagonService.resolveDisplayName(userId);
        } else {
            // Guest mode
            if (guestId != null && !guestId.isBlank()) {
                userId = guestId.startsWith("guest_") ? guestId : "guest_" + guestId;
            } else {
                userId = "guest_" + UUID.randomUUID().toString().substring(0, 8);
            }
            name = (guestDisplayName != null && !guestDisplayName.isBlank())
                    ? guestDisplayName
                    : octagonService.resolveDisplayName(userId);
        }

        String ticket = ticketService.createTicket(userId, name);
        TicketResponse res = TicketResponse.builder()
                .ticket(ticket)
                .expiresInSeconds(30)
                .build();

        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get user ELO, rank and combat statistics")
    public ResponseEntity<ApiResponse<StatsResponse>> getStats(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "userId", required = false) String queryUserId) {

        String effectiveId;
        if (queryUserId != null && !queryUserId.isBlank()) {
            effectiveId = queryUserId;
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
    @Operation(summary = "Get user match history")
    public ResponseEntity<ApiResponse<Page<MatchHistoryEntry>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "userId", required = false) String queryUserId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        String effectiveId;
        if (queryUserId != null && !queryUserId.isBlank()) {
            effectiveId = queryUserId;
        } else if (principal != null) {
            effectiveId = principal.getId().toString();
        } else {
            effectiveId = "guest_default";
        }

        Page<MatchHistoryEntry> history = octagonService.getUserHistory(effectiveId, page, size);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/challenge/create")
    @Operation(summary = "Create duel invite link for friends")
    public ResponseEntity<ApiResponse<ChallengeResponse>> createChallenge(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(value = "guestId", required = false) String guestId,
            @RequestParam(value = "targetUserId", required = false) String targetUserId) {

        String challengerId = principal != null
                ? principal.getId().toString()
                : (guestId != null ? guestId : "guest_" + UUID.randomUUID().toString().substring(0, 8));

        ChallengeResponse response = octagonService.createChallenge(challengerId, targetUserId);
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
    @Operation(summary = "Get match question details (text, options, images) without correct answers (Anti-Cheat)")
    public ResponseEntity<ApiResponse<List<QuestionDto>>> getQuestions(
            @RequestBody List<Long> questionIds) {
        List<QuestionDto> list = octagonService.getQuestionsByIds(questionIds);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/users/search")
    @Operation(summary = "Search users for 1v1 challenge by username, name, phone or ID")
    public ResponseEntity<ApiResponse<List<UserSearchResult>>> searchUsers(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam("q") String query) {

        String currentUserId = principal != null ? principal.getId().toString() : "";
        List<UserSearchResult> results = octagonService.searchUsers(query, currentUserId);

        for (UserSearchResult r : results) {
            boolean online = matchmaker.isUserOnline(r.getUserId());
            r.setOnline(online);
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
            @RequestParam(value = "reporterId", required = false) String guestReporterId,
            @RequestBody ReportRequest request) {

        String reporterId = principal != null
                ? principal.getId().toString()
                : (guestReporterId != null && !guestReporterId.isBlank() ? guestReporterId : "guest_anonymous");

        octagonService.submitReport(reporterId, request);
        return ResponseEntity.ok(ApiResponse.success("Shikoyat qabul qilindi"));
    }
}

