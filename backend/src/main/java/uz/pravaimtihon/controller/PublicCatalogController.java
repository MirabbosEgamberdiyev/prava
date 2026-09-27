package uz.pravaimtihon.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.service.PublicCatalogService;
import uz.pravaimtihon.util.ETags;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * B-10: mehmonlar uchun faqat-o'qish katalogi (biletlar, mavzular) — savol matni va javoblarsiz.
 * /api/v1/public/** SecurityConfig'da permitAll va RateLimitFilter bilan cheklangan.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public catalog", description = "Biletlar va mavzular ro'yxati (autentifikatsiyasiz, savollarsiz)")
public class PublicCatalogController {

    private static final CacheControl CACHE = CacheControl.maxAge(300, TimeUnit.SECONDS).cachePublic();

    private final PublicCatalogService catalogService;
    private final ObjectMapper objectMapper;
    private final uz.pravaimtihon.service.OfflineBundleService offlineBundleService;

    @GetMapping("/desktop-bundle")
    @Operation(summary = "Desktop ilova uchun barcha faol savollar, mavzular va biletlar to'plami (ochiq)")
    public ResponseEntity<ApiResponse<uz.pravaimtihon.service.OfflineBundleService.Bundle>> desktopBundle() {
        return ResponseEntity.ok(ApiResponse.success(offlineBundleService.getBundle()));
    }

    @GetMapping("/tickets")
    @Operation(summary = "Faol biletlar ro'yxati (savollarsiz)")
    public ResponseEntity<ApiResponse<List<PublicCatalogService.PublicTicket>>> tickets(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        return withEtag(catalogService.tickets(), ifNoneMatch);
    }

    @GetMapping("/topics")
    @Operation(summary = "Faol mavzular ro'yxati savollar soni bilan (savollarsiz)")
    public ResponseEntity<ApiResponse<List<PublicCatalogService.PublicTopic>>> topics(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        return withEtag(catalogService.topics(), ifNoneMatch);
    }

    private <T> ResponseEntity<ApiResponse<T>> withEtag(T data, String ifNoneMatch) {
        String etag;
        try {
            etag = ETags.strongOf(objectMapper.writeValueAsString(data));
        } catch (JsonProcessingException e) {
            return ResponseEntity.ok().cacheControl(CACHE).body(ApiResponse.success(data));
        }
        if (ETags.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).cacheControl(CACHE).build();
        }
        return ResponseEntity.ok().eTag(etag).cacheControl(CACHE).body(ApiResponse.success(data));
    }
}
