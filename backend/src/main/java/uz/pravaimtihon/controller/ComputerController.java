package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.ComputerRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.ComputerResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.ComputerStatus;
import uz.pravaimtihon.service.ComputerService;

import java.util.List;
import java.util.Map;

/**
 * O'quv markazi kompyuterlarini boshqarish.
 * Barcha endpointlar {@code SUPER_ADMIN} roli talab qiladi.
 *
 * <p>Base path: {@code /api/v1/admin/computers}</p>
 */
@RestController
@RequestMapping("/api/v1/admin/computers")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Computers", description = "Learning center computer management — SUPER_ADMIN only")
public class ComputerController {

    private final ComputerService service;

    // ── Create ────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Yangi kompyuter yaratish")
    public ResponseEntity<ApiResponse<ComputerResponse>> create(
            @Valid @RequestBody ComputerRequest request,
            Authentication auth) {

        ComputerResponse resp = service.create(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Kompyuter yaratildi", resp));
    }

    // ── Update ────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Kompyuterni yangilash")
    public ResponseEntity<ApiResponse<ComputerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ComputerRequest request,
            Authentication auth) {

        ComputerResponse resp = service.update(id, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Kompyuter yangilandi", resp));
    }

    // ── List ──────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Kompyuterlar ro'yxati (filtrlash va sahifalash)")
    public ResponseEntity<ApiResponse<PageResponse<ComputerResponse>>> list(
            @RequestParam(required = false) Long   learningCenterId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "20")        int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "asc")       String sortDir) {

        ComputerStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = ComputerStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Noto'g'ri status: " + status));
            }
        }

        PageResponse<ComputerResponse> result =
                service.list(learningCenterId, search, statusEnum, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Get by ID ─────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "ID bo'yicha bitta kompyuter")
    public ResponseEntity<ApiResponse<ComputerResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── Active list: by LC ────────────────────────────────────────────────

    @GetMapping("/active")
    @Operation(summary = "Barcha faol kompyuterlar (global dropdown uchun)")
    public ResponseEntity<ApiResponse<List<ComputerResponse>>> listAllActive() {
        return ResponseEntity.ok(ApiResponse.success(service.listAllActive()));
    }

    @GetMapping("/active/by-lc/{lcId}")
    @Operation(summary = "Berilgan o'quv markazi faol kompyuterlari (dropdown uchun)")
    public ResponseEntity<ApiResponse<List<ComputerResponse>>> listActiveByLc(
            @PathVariable Long lcId) {
        return ResponseEntity.ok(ApiResponse.success(
                service.listActiveByLearningCenter(lcId)));
    }

    // ── Set status ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    @Operation(summary = "Kompyuter holatini o'zgartirish (ACTIVE / INACTIVE)")
    public ResponseEntity<ApiResponse<ComputerResponse>> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String statusStr = body != null ? body.getOrDefault("status", "") : "";
        ComputerStatus newStatus;
        try {
            newStatus = ComputerStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Noto'g'ri status: " + statusStr));
        }

        ComputerResponse resp = service.setStatus(id, newStatus, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Holat yangilandi", resp));
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Kompyuterni o'chirish (INACTIVE va kodlarsiz bo'lishi shart)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            Authentication auth) {

        service.delete(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Kompyuter o'chirildi", null));
    }
}
