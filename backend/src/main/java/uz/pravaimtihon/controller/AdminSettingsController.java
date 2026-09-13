package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.service.SettingsService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@Tag(name = "Admin System Settings", description = "Tizim global sozlamalari (Sayt nomi, kontaktlar, SEO, logo)")
public class AdminSettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @Operation(summary = "Barcha tizim sozlamalarini olish")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllSettings()));
    }

    @PutMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Tizim sozlamalarini yangilash (faqat SUPER_ADMIN)")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateSettings(
            @RequestBody Map<String, String> settings) {
        settingsService.updateSettings(settings);
        return ResponseEntity.ok(ApiResponse.success("Tizim sozlamalari yangilandi", settingsService.getAllSettings()));
    }
}
