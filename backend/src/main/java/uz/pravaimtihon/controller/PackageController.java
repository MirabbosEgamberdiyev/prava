package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.PackageRequest;
import uz.pravaimtihon.dto.request.PackagePatchRequest;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.PackageService;

/**
 * ✅ Imtihon Paketlari Controller - To'liq Multi-Language + i18n
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 */
@RestController
@RequestMapping("/api/v1/packages")
@RequiredArgsConstructor
@Tag(name = "Package Management", description = "Imtihon paketlarini yaratish, tahrirlash, o'chirish")
public class PackageController {

    private final PackageService packageService;
    private final MessageService messageService;

    @GetMapping
    @Operation(
            summary = "Faol paketlar ro'yxati",
            description = "Foydalanuvchilar uchun mavjud faol paketlarni sahifalab qaytaradi."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Paketlar ro'yxati muvaffaqiyatli qaytarildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Muvaffaqiyatli",
                                      "data": {
                                        "content": [
                                          {
                                            "id": 1,
                                            "name": "Yo'l harakati qoidalari - 1-bilet",
                                            "description": "20 ta savol, 20 daqiqa",
                                            "topicCode": "YHQ",
                                            "topicName": "Yo'l harakati qoidalari",
                                            "questionCount": 20,
                                            "timeLimitMinutes": 20,
                                            "isFree": true,
                                            "isActive": true,
                                            "orderIndex": 1
                                          }
                                        ],
                                        "page": 0,
                                        "size": 20,
                                        "totalElements": 50,
                                        "totalPages": 3,
                                        "first": true,
                                        "last": false
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Server xatosi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ichki server xatosi",
                                      "data": null
                                    }
                                    """)
                    )
            )
    })
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getAllPackages(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "orderIndex") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "ASC") String direction,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<PackageResponse> response = packageService.getAllPackages(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Barcha paketlar (admin)",
            description = "Faol va nofaol barcha paketlar. Faqat ADMIN/SUPER_ADMIN."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Paketlar ro'yxati (admin)"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Ruxsat yo'q - faqat ADMIN/SUPER_ADMIN"
            )
    })
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getAllPackagesAdmin(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "orderIndex") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "ASC") String direction,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<PackageResponse> response = packageService.getAllPackagesAdmin(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/free")
    @Operation(summary = "Get free packages", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getFreePackages(
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "orderIndex") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "ASC") String direction,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<PackageResponse> response = packageService.getFreePackages(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get package by ID", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PackageResponse>> getPackage(
            @PathVariable Long id,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        PackageResponse response = packageService.getPackageById(id, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/detail")
    @Operation(summary = "Get package detail with questions", description = "Multi-language: UZL, UZC, EN, RU")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PackageDetailResponse>> getPackageDetail(
            @PathVariable Long id,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        PackageDetailResponse response = packageService.getPackageDetail(id, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/topic/{topicCode}")
    @Operation(summary = "Get packages by topic code", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<PageResponse<PackageResponse>>> getPackagesByTopic(
            @PathVariable String topicCode,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "orderIndex") String sortBy,
            @Parameter(description = "ASC|DESC") @RequestParam(defaultValue = "ASC") String direction,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        PageResponse<PackageResponse> response = packageService.getPackagesByTopic(topicCode, pageable, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Paket yaratish",
            description = "Yangi imtihon paketi. Majburiy: nameUzl, topicId, questionCount."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Paket muvaffaqiyatli yaratildi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Paket muvaffaqiyatli yaratildi",
                                      "data": {
                                        "id": 1,
                                        "name": "YHQ - 1-bilet",
                                        "questionCount": 20,
                                        "timeLimitMinutes": 20,
                                        "isFree": true,
                                        "isActive": true
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri so'rov - yetarli savollar yo'q",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Ushbu mavzuda yetarli savol mavjud emas. Kerak: 20, Mavjud: 15",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Ruxsat yo'q"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Mavzu topilmadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "422",
                    description = "Validatsiya xatosi"
            )
    })
    public ResponseEntity<ApiResponse<PackageResponse>> createPackage(
            @Valid @RequestBody PackageRequest request,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        PackageResponse response = packageService.createPackage(request, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.package.created", language), response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Update package (full update)", description = "Updates all package fields. Use PATCH for partial updates.")
    public ResponseEntity<ApiResponse<PackageResponse>> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody PackageRequest request,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        PackageResponse response = packageService.updatePackage(id, request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.package.updated", language), response));
    }

    /**
     * ✅ NEW: PATCH endpoint for partial updates
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Partially update package",
            description = "Updates only provided fields. Null fields are ignored. Multi-language: UZL, UZC, EN, RU"
    )
    public ResponseEntity<ApiResponse<PackageResponse>> patchPackage(
            @PathVariable Long id,
            @Valid @RequestBody PackagePatchRequest request,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        PackageResponse response = packageService.patchPackage(id, request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.package.patched", language), response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete package (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deletePackage(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        packageService.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.package.deleted", language), null));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Toggle package active/inactive status")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        packageService.togglePackageStatus(id);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.package.status.toggled", language), null));
    }

    @PostMapping("/{id}/regenerate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Regenerate package questions",
            description = "⚠️ WARNING: This will replace all questions. Creates version snapshot. Multi-language: UZL, UZC, EN, RU"
    )
    public ResponseEntity<ApiResponse<PackageResponse>> regenerateQuestions(
            @PathVariable Long id,
            @Parameter(description = "uzl|uzc|en|ru") @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        PackageResponse response = packageService.regeneratePackageQuestions(id, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.package.regenerated", language), response));
    }

    @GetMapping("/count")
    @Operation(summary = "Get active package count")
    public ResponseEntity<ApiResponse<Long>> getPackageCount(
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        long count = packageService.getPackageCount();
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.package.count.retrieved", language), count));
    }

}