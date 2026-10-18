package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.security.CustomUserDetails;
import uz.pravaimtihon.service.impl.UserAppService;

import java.util.List;

/**
 * Prava-Desktop-Online uchun user-facing controller.
 * Barcha endpointlar USER role uchun.
 *
 * Base: /api/v1/app
 */
@RestController
@RequestMapping("/api/v1/app")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Desktop App API", description = "Prava-Desktop-Online uchun API endpoints")
public class UserAppController {

    private final UserAppService userAppService;
    private final uz.pravaimtihon.service.OfflineBundleService offlineBundleService;
    private final uz.pravaimtihon.service.BundleCryptoService bundleCryptoService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    // ─── Offline bundle (desktop / mobile) ────────────────────────────────────

    @GetMapping(value = "/offline-bundle")
    @Operation(summary = "Offline rejim uchun AES-256-GCM shifrlangan savollar to'plami (faqat Desktop/Mobile)")
    public ResponseEntity<?> getOfflineBundle(
            jakarta.servlet.http.HttpServletRequest request,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch,
            @RequestHeader(value = "X-Client-Platform", required = false) String clientPlatform,
            @AuthenticationPrincipal CustomUserDetails principal) {

        // 1. Web brauzer tekshiruvi: brauzer orqali to'liq bazani yuklash 100% bloklanadi
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");
        String secFetch = request.getHeader("Sec-Fetch-Mode");
        boolean isBrowser = false;

        if ("web".equalsIgnoreCase(clientPlatform)) {
            isBrowser = true;
        } else if (origin != null && (origin.contains("web.pravaonline.uz") || origin.contains("pravaonline.uz"))) {
            if (!"desktop".equalsIgnoreCase(clientPlatform) && !"mobile".equalsIgnoreCase(clientPlatform)) {
                isBrowser = true;
            }
        } else if (secFetch != null && !"desktop".equalsIgnoreCase(clientPlatform) && !"mobile".equalsIgnoreCase(clientPlatform)) {
            isBrowser = true;
        } else if (referer != null && (referer.contains("web.pravaonline.uz") || referer.contains("pravaonline.uz"))) {
            if (!"desktop".equalsIgnoreCase(clientPlatform) && !"mobile".equalsIgnoreCase(clientPlatform)) {
                isBrowser = true;
            }
        }

        if (isBrowser) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Web brauzerlar uchun offline-bundle taqiqlangan. Savollar On-Demand yuklanadi."));
        }

        Long userId = principal != null ? principal.getId() : null;
        String etag = "\"" + offlineBundleService.currentVersionFor(userId) + "\"";
        org.springframework.http.CacheControl cc = org.springframework.http.CacheControl.noCache().cachePrivate();

        if (uz.pravaimtihon.util.ETags.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_MODIFIED).eTag(etag).cacheControl(cc).build();
        }

        uz.pravaimtihon.service.OfflineBundleService.Bundle bundle = offlineBundleService.getBundleFor(userId);
        try {
            byte[] jsonBytes = objectMapper.writeValueAsBytes(bundle);
            byte[] encrypted = bundleCryptoService.encryptBundle(jsonBytes);

            return ResponseEntity.ok()
                    .eTag(etag)
                    .cacheControl(cc)
                    .header("X-Encrypted-Algorithm", "AES-256-GCM")
                    .header("Content-Disposition", "attachment; filename=\"bundle.enc\"")
                    .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                    .body(encrypted);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Offline bundle shifrlashda xatolik yuz berdi"));
        }
    }

    // ─── Topics ───────────────────────────────────────────────────────────────

    @GetMapping("/topics")
    @Operation(summary = "Barcha aktiv mavzularni olish")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopics() {
        return ResponseEntity.ok(ApiResponse.success(
                "Mavzular muvaffaqiyatli olindi",
                userAppService.getActiveTopics()
        ));
    }

    @GetMapping("/topics/{topicId}/questions")
    @Operation(summary = "Mavzu bo'yicha barcha savollarni olish (marathon uchun)")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestionsByTopic(
            @PathVariable Long topicId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Savollar muvaffaqiyatli olindi",
                userAppService.getQuestionsByTopic(topicId)
        ));
    }

    // ─── Wrong Answers ────────────────────────────────────────────────────────

    @PostMapping("/wrong-answers/{questionId}")
    @Operation(summary = "Xato javob qo'shish yoki wrong_count oshirish")
    public ResponseEntity<ApiResponse<Void>> addWrongAnswer(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        userAppService.addWrongAnswer(principal.getId(), questionId);
        return ResponseEntity.ok(ApiResponse.success("Xato javob saqlandi", null));
    }

    @GetMapping("/wrong-answers")
    @Operation(summary = "Xato qilingan savollarni olish")
    public ResponseEntity<ApiResponse<List<WrongAnswerResponse>>> getWrongAnswers(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Xato javoblar olindi",
                userAppService.getWrongAnswers(principal.getId())
        ));
    }

    @DeleteMapping("/wrong-answers/{questionId}")
    @Operation(summary = "Xatolar ro'yxatidan o'chirish")
    public ResponseEntity<ApiResponse<Void>> removeWrongAnswer(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        userAppService.removeWrongAnswer(principal.getId(), questionId);
        return ResponseEntity.ok(ApiResponse.success("O'chirildi", null));
    }

    // ─── Saved Questions ──────────────────────────────────────────────────────

    @PostMapping("/saved-questions/{questionId}")
    @Operation(summary = "Savolni saqlash (idempotent; ?toggle=true bo'lsa toggle)")
    public ResponseEntity<ApiResponse<Boolean>> saveOrToggleSavedQuestion(
            @PathVariable Long questionId,
            @RequestParam(required = false, defaultValue = "false") boolean toggle,
            @AuthenticationPrincipal CustomUserDetails principal) {
        boolean saved = toggle
                ? userAppService.toggleSavedQuestion(principal.getId(), questionId)
                : userAppService.saveQuestion(principal.getId(), questionId);
        return ResponseEntity.ok(ApiResponse.success(
                saved ? "Savol saqlandi" : "Savol o'chirildi",
                saved
        ));
    }

    @DeleteMapping("/saved-questions/{questionId}")
    @Operation(summary = "Savolni saqlanganlardan o'chirish (idempotent)")
    public ResponseEntity<ApiResponse<Void>> removeSavedQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        userAppService.removeSavedQuestion(principal.getId(), questionId);
        return ResponseEntity.ok(ApiResponse.success("Savol o'chirildi", null));
    }

    @GetMapping("/saved-questions")
    @Operation(summary = "Saqlangan savollarni olish")
    public ResponseEntity<ApiResponse<List<SavedQuestionResponse>>> getSavedQuestions(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Saqlangan savollar olindi",
                userAppService.getSavedQuestions(principal.getId())
        ));
    }

    @GetMapping("/saved-questions/{questionId}/check")
    @Operation(summary = "Savol saqlangan yoki yo'qligini tekshirish")
    public ResponseEntity<ApiResponse<Boolean>> isQuestionSaved(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Tekshirildi",
                userAppService.isQuestionSaved(principal.getId(), questionId)
        ));
    }
}
