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
import uz.pravaimtihon.dto.request.LearningCenterRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.LearningCenterResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.LearningCenterStatus;
import uz.pravaimtihon.service.LearningCenterService;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for learning-center (driving school) management.
 * Every endpoint requires the {@code SUPER_ADMIN} role.
 *
 * <p>Base path: {@code /api/v1/admin/learning-centers}</p>
 */
@RestController
@RequestMapping("/api/v1/admin/learning-centers")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Learning Centers", description = "Driving school management — SUPER_ADMIN only")
public class LearningCenterController {

    private final LearningCenterService service;

    // ── Create ────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a new learning center")
    public ResponseEntity<ApiResponse<LearningCenterResponse>> create(
            @Valid @RequestBody LearningCenterRequest request,
            Authentication auth) {

        LearningCenterResponse response = service.create(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Learning center created successfully", response));
    }

    // ── Update ────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing learning center")
    public ResponseEntity<ApiResponse<LearningCenterResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody LearningCenterRequest request,
            Authentication auth) {

        LearningCenterResponse response = service.update(id, request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Learning center updated successfully", response));
    }

    // ── List ──────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List learning centers with optional filters and pagination")
    public ResponseEntity<ApiResponse<PageResponse<LearningCenterResponse>>> list(
            @RequestParam(required = false)                String search,
            @RequestParam(required = false)                String status,
            @RequestParam(defaultValue = "0")              int page,
            @RequestParam(defaultValue = "20")             int size,
            @RequestParam(defaultValue = "createdAt")      String sortBy,
            @RequestParam(defaultValue = "desc")           String sortDir) {

        LearningCenterStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = LearningCenterStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid status value: " + status));
            }
        }

        PageResponse<LearningCenterResponse> result =
                service.list(search, statusEnum, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Get by ID ─────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get a single learning center by ID")
    public ResponseEntity<ApiResponse<LearningCenterResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── Active list (dropdown) ────────────────────────────────────────────

    @GetMapping("/active")
    @Operation(summary = "Flat list of all ACTIVE learning centers for dropdowns")
    public ResponseEntity<ApiResponse<List<LearningCenterResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(service.listActive()));
    }

    // ── Set status ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change the status of a learning center (ACTIVE / INACTIVE)")
    public ResponseEntity<ApiResponse<LearningCenterResponse>> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String statusStr = body != null ? body.getOrDefault("status", "") : "";
        LearningCenterStatus newStatus;
        try {
            newStatus = LearningCenterStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid status value: " + statusStr));
        }

        LearningCenterResponse response = service.setStatus(id, newStatus, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a learning center (must be INACTIVE with no active codes)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            Authentication auth) {

        service.delete(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Learning center deleted", null));
    }
}
