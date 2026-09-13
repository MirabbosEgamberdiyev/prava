package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.entity.NewsArticle;
import uz.pravaimtihon.service.NewsService;

@RestController
@RequestMapping("/api/v1/public/news")
@RequiredArgsConstructor
@Tag(name = "Public News", description = "Ommaviy yangiliklar va maqolalar")
public class PublicNewsController {

    private final NewsService newsService;

    @GetMapping
    @Operation(summary = "Nashr qilingan yangiliklar ro'yxati")
    public ResponseEntity<ApiResponse<Page<NewsArticle>>> getPublishedNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"));
        return ResponseEntity.ok(ApiResponse.success(newsService.getPublished(pageable)));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Slug bo'yicha yangilikni o'qish (ko'rishlar soni oshadi)")
    public ResponseEntity<ApiResponse<NewsArticle>> getNewsBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(newsService.getBySlugAndIncrementViews(slug)));
    }
}
