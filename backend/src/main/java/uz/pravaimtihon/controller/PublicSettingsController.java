package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.service.SettingsService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/public/settings")
@RequiredArgsConstructor
@Tag(name = "Public Settings", description = "Ommaviy tizim sozlamalari va aloqa rekvizitlari")
public class PublicSettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @Operation(summary = "Ommaviy sozlamalar (sayt nomi, rasmiy telefon, telegram, SEO)")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPublicSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllSettings()));
    }
}
