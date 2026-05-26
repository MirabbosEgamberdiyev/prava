package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.ActivationCodeFilterRequest;
import uz.pravaimtihon.dto.request.ActivationCodeRequest;
import uz.pravaimtihon.dto.response.ActivationCodeResponse;
import uz.pravaimtihon.dto.response.ActivationCodeStatsResponse;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.service.ActivationCodeService;

import java.util.Map;

/**
 * REST endpoints for the desktop activation-code management module.
 * Every endpoint requires the {@code SUPER_ADMIN} role.
 *
 * <p>Base path: {@code /api/v1/admin/activation-codes}</p>
 */
@RestController
@RequestMapping("/api/v1/admin/activation-codes")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Activation Codes", description = "Desktop license management — SUPER_ADMIN only")
public class ActivationCodeController {

    private final ActivationCodeService service;

    // ── Generate ──────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Generate a new activation code")
    public ResponseEntity<ApiResponse<ActivationCodeResponse>> generate(
            @Valid @RequestBody ActivationCodeRequest request,
            Authentication auth) {

        String operator = auth.getName();
        log.info("SUPER_ADMIN '{}' generating activation code for computer id={}",
                operator, request.getComputerId());

        ActivationCodeResponse response = service.generate(request, operator);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Activation code generated successfully", response));
    }

    // ── List ──────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List activation codes with optional filters and pagination")
    public ResponseEntity<ApiResponse<PageResponse<ActivationCodeResponse>>> list(
            @Parameter(description = "Full-text search (machineId, name, phone, learning centre)")
            @RequestParam(required = false) String search,

            @Parameter(description = "Persisted status filter: ACTIVE | EXPIRED | DEACTIVATED")
            @RequestParam(required = false) String status,

            @Parameter(description = "Display group: ACTIVE | EXPIRING | EXPIRED | DEACTIVATED")
            @RequestParam(required = false) String group,

            @Parameter(description = "Filter by computer ID")
            @RequestParam(required = false) Long computerId,

            @Parameter(description = "Filter by learning center ID")
            @RequestParam(required = false) Long learningCenterId,
            @RequestParam(required = false) String generatedBy,
            @RequestParam(required = false) String startDateFrom,
            @RequestParam(required = false) String startDateTo,
            @RequestParam(required = false) String endDateFrom,
            @RequestParam(required = false) String endDateTo,

            @RequestParam(defaultValue = "0")        int page,
            @RequestParam(defaultValue = "20")       int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir) {

        ActivationCodeFilterRequest filter = new ActivationCodeFilterRequest();
        filter.setSearch(search);
        filter.setGroup(group);
        filter.setComputerId(computerId);
        filter.setLearningCenterId(learningCenterId);
        filter.setGeneratedBy(generatedBy);
        filter.setPage(page);
        filter.setSize(Math.min(size, 100));
        filter.setSortBy(sortBy);
        filter.setSortDir(sortDir);

        // Parse status
        if (status != null && !status.isBlank()) {
            try {
                filter.setStatus(uz.pravaimtihon.entity.ActivationCodeStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid status value: " + status));
            }
        }

        // Parse dates
        filter.setStartDateFrom(parseDate(startDateFrom));
        filter.setStartDateTo(parseDate(startDateTo));
        filter.setEndDateFrom(parseDate(endDateFrom));
        filter.setEndDateTo(parseDate(endDateTo));

        PageResponse<ActivationCodeResponse> result = service.list(filter);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Stats ─────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Get group-counts for the activation-code dashboard tab-bar")
    public ResponseEntity<ApiResponse<ActivationCodeStatsResponse>> stats() {
        return ResponseEntity.ok(ApiResponse.success(service.getStats()));
    }

    // ── Get by ID ─────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get a single activation code by ID")
    public ResponseEntity<ApiResponse<ActivationCodeResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── Deactivate ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate (revoke) an activation code")
    public ResponseEntity<ApiResponse<ActivationCodeResponse>> deactivate(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {

        String reason   = body != null ? body.getOrDefault("reason", "") : "";
        String operator = auth.getName();
        log.info("SUPER_ADMIN '{}' deactivating activation code id={}", operator, id);

        ActivationCodeResponse response = service.deactivate(id, reason, operator);
        return ResponseEntity.ok(ApiResponse.success("Activation code deactivated", response));
    }

    // ── Reactivate ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate a previously deactivated code")
    public ResponseEntity<ApiResponse<ActivationCodeResponse>> reactivate(
            @PathVariable Long id,
            Authentication auth) {

        String operator = auth.getName();
        log.info("SUPER_ADMIN '{}' reactivating activation code id={}", operator, id);

        ActivationCodeResponse response = service.reactivate(id, operator);
        return ResponseEntity.ok(ApiResponse.success("Activation code reactivated", response));
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an activation code (must be DEACTIVATED or EXPIRED)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            Authentication auth) {

        String operator = auth.getName();
        log.info("SUPER_ADMIN '{}' deleting activation code id={}", operator, id);

        service.delete(id, operator);
        return ResponseEntity.ok(ApiResponse.success("Activation code deleted", null));
    }

    // ── Private ───────────────────────────────────────────────────────────

    private static java.time.LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return java.time.LocalDate.parse(s);
        } catch (Exception e) {
            return null;
        }
    }
}
