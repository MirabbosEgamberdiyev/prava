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
import uz.pravaimtihon.entity.NewsArticle;
import uz.pravaimtihon.service.NewsService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/news")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER')")
@Tag(name = "Admin News CMS", description = "Yangiliklar va maqolalar boshqaruvi")
public class AdminNewsController {

    private final NewsService newsService;

    @GetMapping
    @Operation(summary = "Barcha yangiliklarni filtrlash bilan olish")
    public ResponseEntity<ApiResponse<Page<NewsArticle>>> list(
            @RequestParam(required = false) Boolean published,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<NewsArticle> result = newsService.getAll(pageable, published, search);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "ID bo'yicha yangilikni olish")
    public ResponseEntity<ApiResponse<NewsArticle>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Yangi yangilik yaratish")
    public ResponseEntity<ApiResponse<NewsArticle>> create(@RequestBody NewsArticle article) {
        NewsArticle created = newsService.create(article);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Yangilik yaratildi", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Yangilikni tahrirlash")
    public ResponseEntity<ApiResponse<NewsArticle>> update(
            @PathVariable Long id,
            @RequestBody NewsArticle article) {
        NewsArticle updated = newsService.update(id, article);
        return ResponseEntity.ok(ApiResponse.success("Yangilik yangilandi", updated));
    }

    @PatchMapping("/{id}/publish")
    @Operation(summary = "Nashr qilish holatini o'zgartirish")
    public ResponseEntity<ApiResponse<NewsArticle>> togglePublish(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        Boolean isPublished = body != null ? body.get("isPublished") : false;
        NewsArticle updated = newsService.togglePublish(id, isPublished);
        return ResponseEntity.ok(ApiResponse.success("Nashr holati yangilandi", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Yangilikni o'chirish")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        newsService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Yangilik o'chirildi", null));
    }
}
