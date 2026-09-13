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
import uz.pravaimtihon.entity.ContactInquiry;
import uz.pravaimtihon.enums.InquiryStatus;
import uz.pravaimtihon.enums.InquiryType;
import uz.pravaimtihon.service.ContactInquiryService;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/admin/contact-inquiries", "/api/v1/admin/contact"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'SUPPORT')")
@Tag(name = "Admin Contact Inquiries", description = "Murojaatlar va so'rovlar CRM boshqaruvi")
public class AdminContactInquiryController {

    private final ContactInquiryService inquiryService;

    @GetMapping
    @Operation(summary = "Murojaatlar ro'yxatini filtrlash va sahifalash bilan olish")
    public ResponseEntity<ApiResponse<Page<ContactInquiry>>> list(
            @RequestParam(required = false) InquiryStatus status,
            @RequestParam(required = false) InquiryType inquiryType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<ContactInquiry> inquiries = inquiryService.getAllInquiries(pageable, status, inquiryType, search);
        return ResponseEntity.ok(ApiResponse.success(inquiries));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Murojaat statusini va izohini yangilash")
    public ResponseEntity<ApiResponse<ContactInquiry>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String statusStr = body != null ? body.get("status") : null;
        String adminNote = body != null ? body.get("adminNote") : null;

        InquiryStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = InquiryStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Noto'g'ri status: " + statusStr));
            }
        }

        ContactInquiry updated = inquiryService.updateStatus(id, status, adminNote);
        return ResponseEntity.ok(ApiResponse.success("Murojaat holati yangilandi", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Murojaatni o'chirish")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        inquiryService.deleteInquiry(id);
        return ResponseEntity.ok(ApiResponse.success("Murojaat o'chirildi", null));
    }
}
