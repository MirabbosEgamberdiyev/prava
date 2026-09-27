package uz.pravaimtihon.controller;

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
import uz.pravaimtihon.service.TrafficFineService;
import uz.pravaimtihon.util.ETags;

import java.util.concurrent.TimeUnit;

/**
 * B-08: yo'l harakati jarimalari va joriy BHM (public). Kuchli ETag + If-None-Match → 304.
 * /api/v1/public/** SecurityConfig'da permitAll va RateLimitFilter bilan cheklangan.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public fines", description = "Yo'l harakati jarimalari (BHM koeffitsientlari) va BHM")
public class PublicFinesController {

    private static final CacheControl CACHE = CacheControl.maxAge(300, TimeUnit.SECONDS).cachePublic();

    private final TrafficFineService fineService;

    @GetMapping("/fines")
    @Operation(summary = "Jarimalar ro'yxati va joriy BHM (ETag bilan)")
    public ResponseEntity<ApiResponse<TrafficFineService.FinesPayload>> fines(
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
        TrafficFineService.FinesPayload payload = fineService.publicFines();
        String etag = "\"" + payload.version() + "\"";
        if (ETags.matches(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).cacheControl(CACHE).build();
        }
        return ResponseEntity.ok().eTag(etag).cacheControl(CACHE).body(ApiResponse.success(payload));
    }
}
