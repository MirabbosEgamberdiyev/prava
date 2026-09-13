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
import uz.pravaimtihon.entity.PartnerLead;
import uz.pravaimtihon.enums.PartnerLeadStatus;
import uz.pravaimtihon.service.PartnerLeadService;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin/partner-leads", "/api/v1/admin/partners"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SUPPORT')")
@Tag(name = "Admin Partner Leads", description = "Hamkorlik arizalari CRM boshqaruvi")
public class AdminPartnerLeadController {

    private final PartnerLeadService leadService;

    @GetMapping
    @Operation(summary = "B2B hamkorlik arizalarini olish")
    public ResponseEntity<ApiResponse<Page<PartnerLead>>> list(
            @RequestParam(required = false) PartnerLeadStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<PartnerLead> leads = leadService.getAllLeads(pageable, status, search);
        return ResponseEntity.ok(ApiResponse.success(leads));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Hamkorlik statusini yangilash (NEW, CONTACTED, NEGOTIATION, CONVERTED, REJECTED)")
    public ResponseEntity<ApiResponse<PartnerLead>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String statusStr = body != null ? body.get("status") : null;
        String adminNote = body != null ? body.get("adminNote") : null;

        PartnerLeadStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = PartnerLeadStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Noto'g'ri status: " + statusStr));
            }
        }

        PartnerLead updated = leadService.updateStatus(id, status, adminNote);
        return ResponseEntity.ok(ApiResponse.success("Hamkorlik holati yangilandi", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Hamkorlik arizasini o'chirish")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        leadService.deleteLead(id);
        return ResponseEntity.ok(ApiResponse.success("Hamkorlik arizasi o'chirildi", null));
    }
}
