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
@PreAuthorize("hasRole('USER')")
@Tag(name = "Desktop App API", description = "Prava-Desktop-Online uchun API endpoints")
public class UserAppController {

    private final UserAppService userAppService;

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
    @Operation(summary = "Savolni saqlash/o'chirish (toggle). true=saqlandi, false=o'chirildi")
    public ResponseEntity<ApiResponse<Boolean>> toggleSavedQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        boolean saved = userAppService.toggleSavedQuestion(principal.getId(), questionId);
        return ResponseEntity.ok(ApiResponse.success(
                saved ? "Savol saqlandi" : "Savol o'chirildi",
                saved
        ));
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
