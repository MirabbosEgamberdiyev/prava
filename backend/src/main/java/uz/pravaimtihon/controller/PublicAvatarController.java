package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.service.impl.AvatarService;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Tayyor avatarlar to'plami (8 ta, haydovchi/avtomobil mavzusi). Rasmlar jar ichida — server diskiga
 * qo'shimcha fayl joylash shart emas. {@code /api/v1/public/**} ochiq (SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/public/avatars")
@Tag(name = "Avatars", description = "Tayyor profil avatarlari")
public class PublicAvatarController {

    private static final MediaType SVG = MediaType.parseMediaType("image/svg+xml");

    @GetMapping
    @Operation(summary = "Tayyor avatarlar ro'yxati (id va URL)")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> list() {
        List<Map<String, String>> presets = AvatarService.PRESET_IDS.stream()
                .map(id -> Map.of("id", id, "url", AvatarService.presetUrl(id)))
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(ApiResponse.success(presets));
    }

    @GetMapping("/{file:.+}")
    @Operation(summary = "Tayyor avatar rasmi (SVG)")
    public ResponseEntity<Resource> preset(@PathVariable("file") String file) {
        String url = AvatarService.PRESET_PREFIX + file;
        if (!AvatarService.isPresetUrl(url)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new ClassPathResource("avatars/presets/" + file);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(SVG)
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                // SVG to'g'ridan-to'g'ri ochilsa ham skript ishlamasin
                .header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
                .header("X-Content-Type-Options", "nosniff")
                .body(resource);
    }
}
