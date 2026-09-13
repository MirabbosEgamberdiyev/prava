package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.entity.FaqItem;
import uz.pravaimtihon.service.FaqService;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/admin/faqs", "/api/v1/admin/faq"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER')")
@Tag(name = "Admin FAQ CMS", description = "Ko'p tilli FAQ savol-javoblar boshqaruvi")
public class AdminFaqController {

    private final FaqService faqService;

    @GetMapping
    @Operation(summary = "Barcha FAQ larni olish")
    public ResponseEntity<ApiResponse<Page<FaqItem>>> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "sortOrder") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {

        Sort.Direction sortDirection = "DESC".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<FaqItem> result = faqService.getAll(pageable, active, category, search);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/categories")
    @Operation(summary = "Mavjud barcha FAQ kategoriyalarini olish")
    public ResponseEntity<ApiResponse<List<String>>> categories() {
        return ResponseEntity.ok(ApiResponse.success(faqService.getCategories()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "ID bo'yicha FAQ ni olish")
    public ResponseEntity<ApiResponse<FaqItem>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(faqService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Yangi FAQ yaratish")
    public ResponseEntity<ApiResponse<FaqItem>> create(@RequestBody FaqItem faq) {
        FaqItem created = faqService.create(faq);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("FAQ muvaffaqiyatli yaratildi", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "FAQ ni yangilash")
    public ResponseEntity<ApiResponse<FaqItem>> update(
            @PathVariable Long id,
            @RequestBody FaqItem faq) {
        FaqItem updated = faqService.update(id, faq);
        return ResponseEntity.ok(ApiResponse.success("FAQ yangilandi", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "FAQ ni o'chirish")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        faqService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("FAQ o'chirildi", null));
    }
}
