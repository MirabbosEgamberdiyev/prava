package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.entity.ExamAnswer;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.enums.ExamStatus;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.ExamAnswerRepository;
import uz.pravaimtihon.repository.ExamSessionRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/exams")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'ANALYST')")
@Tag(name = "Admin Exams Audit", description = "Foydalanuvchilar imtihonlari va natijalari auditi")
public class AdminExamController {

    private final ExamSessionRepository sessionRepository;
    private final ExamAnswerRepository answerRepository;

    @GetMapping
    @Operation(summary = "Barcha topshirilgan imtihonlar ro'yxatini olish")
    public ResponseEntity<ApiResponse<Page<ExamSession>>> list(
            @RequestParam(required = false) ExamStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "startedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<ExamSession> result = sessionRepository.findAllAdminFiltered(status, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Imtihon sessiyasi tafsilotlari va har bir savolga berilgan javoblar auditi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSessionDetail(@PathVariable Long id) {
        ExamSession session = sessionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imtihon sessiyasi topilmadi"));

        List<ExamAnswer> answers = answerRepository.findByExamSessionIdOrderByQuestionOrder(id);

        Map<String, Object> response = new HashMap<>();
        response.put("session", session);
        response.put("answers", answers);
        response.put("totalAnswered", answers.size());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
