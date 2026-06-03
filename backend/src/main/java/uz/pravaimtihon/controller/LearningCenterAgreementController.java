package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.LearningCenterAgreementRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.LearningCenterAgreementResponse;
import uz.pravaimtihon.entity.LearningCenter;
import uz.pravaimtihon.entity.LearningCenterAgreement;
import uz.pravaimtihon.entity.LearningCenterAgreement.AgreementStatus;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.LearningCenterAgreementRepository;
import uz.pravaimtihon.repository.LearningCenterRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * O'quv markaz shartnomalari — oddiy CRUD eslatma yozuvi.
 * Hech qanday aktivatsiya kodi yoki license bilan bog'lanmagan.
 */
@RestController
@RequestMapping("/api/v1/admin/learning-center-agreements")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Learning Center Agreements", description = "Shartnoma eslatmalari")
public class LearningCenterAgreementController {

    private final LearningCenterAgreementRepository repo;
    private final LearningCenterRepository centerRepo;

    @PostMapping
    @Operation(summary = "Yangi shartnoma eslatmasini yaratish")
    public ResponseEntity<ApiResponse<LearningCenterAgreementResponse>> create(
            @Valid @RequestBody LearningCenterAgreementRequest req,
            Authentication auth) {

        LearningCenter center = centerRepo.findById(req.getLearningCenterId())
                .orElseThrow(() -> new ResourceNotFoundException("error.learning.center.not.found"));

        AgreementStatus status = parseStatus(req.getStatus(), AgreementStatus.ACTIVE);

        LearningCenterAgreement a = LearningCenterAgreement.builder()
                .learningCenter(center)
                .computerCount(req.getComputerCount())
                .startDate(req.getStartDate() != null ? req.getStartDate() : LocalDate.now())
                .endDate(req.getEndDate())
                .status(status)
                .amount(req.getAmount())
                .note(req.getNote())
                .build();
        a.setCreatedBy(auth.getName());
        a.setCreatedAt(LocalDateTime.now());

        a = repo.save(a);
        log.info("Agreement created id={} center={} computers={}",
                a.getId(), center.getName(), a.getComputerCount());
        return ResponseEntity.ok(ApiResponse.success("Shartnoma yaratildi", toResponse(a)));
    }

    @GetMapping
    @Operation(summary = "Shartnomalar ro'yxati (filter: centerId, page, size)")
    public ResponseEntity<ApiResponse<Page<LearningCenterAgreementResponse>>> list(
            @RequestParam(required = false) Long centerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<LearningCenterAgreement> result = repo.findActive(centerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result.map(this::toResponse)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Bitta shartnoma")
    public ResponseEntity<ApiResponse<LearningCenterAgreementResponse>> getOne(@PathVariable Long id) {
        LearningCenterAgreement a = repo.findById(id)
                .filter(x -> !x.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.agreement.not.found"));
        return ResponseEntity.ok(ApiResponse.success(toResponse(a)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Shartnoma yangilash")
    public ResponseEntity<ApiResponse<LearningCenterAgreementResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody LearningCenterAgreementRequest req,
            Authentication auth) {

        LearningCenterAgreement a = repo.findById(id)
                .filter(x -> !x.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.agreement.not.found"));

        if (!a.getLearningCenter().getId().equals(req.getLearningCenterId())) {
            LearningCenter center = centerRepo.findById(req.getLearningCenterId())
                    .orElseThrow(() -> new ResourceNotFoundException("error.learning.center.not.found"));
            a.setLearningCenter(center);
        }
        a.setComputerCount(req.getComputerCount());
        if (req.getStartDate() != null) a.setStartDate(req.getStartDate());
        a.setEndDate(req.getEndDate());
        a.setStatus(parseStatus(req.getStatus(), a.getStatus()));
        a.setAmount(req.getAmount());
        a.setNote(req.getNote());
        a.setUpdatedBy(auth.getName());
        a.setUpdatedAt(LocalDateTime.now());

        a = repo.save(a);
        return ResponseEntity.ok(ApiResponse.success("Shartnoma yangilandi", toResponse(a)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Shartnomani o'chirish (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id, Authentication auth) {
        LearningCenterAgreement a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("error.agreement.not.found"));
        a.setDeleted(true);
        a.setDeletedBy(auth.getName());
        a.setDeletedAt(LocalDateTime.now());
        repo.save(a);
        return ResponseEntity.ok(ApiResponse.success("Shartnoma o'chirildi", null));
    }

    @GetMapping("/expiring")
    @Operation(summary = "Yaqin kunlarda tugovchi shartnomalar (eslatma uchun)")
    public ResponseEntity<ApiResponse<Page<LearningCenterAgreementResponse>>> expiring(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(Math.max(1, Math.min(days, 365)));
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<LearningCenterAgreement> result = repo.findExpiringBetween(today, until, pageable);
        return ResponseEntity.ok(ApiResponse.success(result.map(this::toResponse)));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private LearningCenterAgreementResponse toResponse(LearningCenterAgreement a) {
        long days = a.getEndDate() == null
                ? 0
                : Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), a.getEndDate()));
        return LearningCenterAgreementResponse.builder()
                .id(a.getId())
                .learningCenterId(a.getLearningCenter().getId())
                .learningCenterName(a.getLearningCenter().getName())
                .computerCount(a.getComputerCount())
                .startDate(a.getStartDate())
                .endDate(a.getEndDate())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .amount(a.getAmount())
                .note(a.getNote())
                .createdAt(a.getCreatedAt())
                .createdBy(a.getCreatedBy())
                .updatedAt(a.getUpdatedAt())
                .daysRemaining(days)
                .build();
    }

    private AgreementStatus parseStatus(String raw, AgreementStatus fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        try {
            return AgreementStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }
}
