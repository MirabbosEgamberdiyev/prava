package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.FileUploadResponse;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.FileStorageException;
import uz.pravaimtihon.repository.ExamSessionRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.CachedFileService;
import uz.pravaimtihon.service.impl.FileService;
import uz.pravaimtihon.service.impl.FileStorageManager;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * ✅ Xavfsiz Fayl Boshqaruvi Controller
 * - Aniq ajratish: Controller → Service → Manager
 * - Dinamik URLlar (localhost hardcode qilinmagan)
 * - LOCAL, S3, Cloudinary bilan ishlaydi
 * - To'liq Multi-Language qo'llab-quvvatlash
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(name = "File Management", description = "Fayl yuklash, yuklab olish, o'chirish")
public class SecureFileController {

    private final FileService fileService;
    private final FileStorageManager fileStorageManager;
    private final ExamSessionRepository examSessionRepository;
    private final MessageService messageService;
    private final CachedFileService cachedFileService;

    // ============================================
    // UPLOAD OPERATIONS (Admin Only)
    // ============================================

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Fayl yuklash",
            description = "Bitta fayl yuklash. Papkalar: questions, profiles, documents, videos, general."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "201",
                    description = "Fayl muvaffaqiyatli yuklandi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "message": "Fayl muvaffaqiyatli yuklandi",
                                      "data": {
                                        "fileName": "a1b2c3d4-image.jpg",
                                        "fileUrl": "https://example.com/api/v1/files/questions/a1b2c3d4-image.jpg",
                                        "contentType": "image/jpeg",
                                        "size": 125000
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri fayl formati yoki hajmi",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": false,
                                      "message": "Fayl formati qo'llab-quvvatlanmaydi. Ruxsat etilgan: jpg, png, gif",
                                      "data": null
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autentifikatsiya talab qilinadi"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Ruxsat yo'q - faqat ADMIN/SUPER_ADMIN"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server xatosi - fayl saqlanmadi")
    })
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @Parameter(description = "File to upload") @RequestParam("file") MultipartFile file,
            @Parameter(description = "Folder: questions, profiles, documents, videos, general")
            @RequestParam(defaultValue = "general") String folder,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            FileUploadResponse response = fileService.uploadSingleFile(file, folder, language);
            String message = messageService.getMessage("file.upload.success", language);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(message, response));

        } catch (FileStorageException e) {
            String message = messageService.getMessage("file.upload.failed", language);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(message + ": " + e.getMessage()));

        } catch (Exception e) {
            String message = messageService.getMessage("error.internal", language);
            log.error("❌ Unexpected upload error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(message));
        }
    }

    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Upload multiple files", description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> uploadMultipleFiles(
            @Parameter(description = "Files to upload") @RequestParam("files") MultipartFile[] files,
            @Parameter(description = "Folder name") @RequestParam(defaultValue = "general") String folder,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        FileService.UploadMultipleResult result = fileService.uploadMultipleFiles(files, folder, language);

        String message = messageService.getMessage(
                "file.upload.multiple.result",
                new Object[]{result.successfulUploads().size(), files.length},
                language
        );

        if (!result.errors().isEmpty()) {
            String errorMsg = messageService.getMessage("file.upload.errors", language);
            message += ". " + errorMsg + ": " + String.join(", ", result.errors());
        }

        HttpStatus status = result.successfulUploads().isEmpty() ? HttpStatus.BAD_REQUEST : HttpStatus.CREATED;
        return ResponseEntity.status(status)
                .body(ApiResponse.success(message, result.successfulUploads()));
    }

    // ============================================
    // DOWNLOAD OPERATIONS
    // ============================================

    @GetMapping("/download/by-name")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Download file by fileName",
            description = "Provide fileName and folder. Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<Resource> downloadByFileName(
            @Parameter(description = "File name") @RequestParam String fileName,
            @Parameter(description = "Folder name") @RequestParam(defaultValue = "general") String folder,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            FileService.FileDownloadResult result = fileService.downloadByFileName(fileName, folder, language);
            return buildDownloadResponse(result);
        } catch (FileStorageException e) {
            log.error("❌ Download by fileName failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/download/by-url")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(summary = "Download file by fileUrl",
            description = "Works with LOCAL, S3, Cloudinary URLs. Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<Resource> downloadByFileUrl(
            @Parameter(description = "Complete file URL") @RequestParam String fileUrl,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            FileService.FileDownloadResult result = fileService.downloadByFileUrl(fileUrl, language);
            return buildDownloadResponse(result);
        } catch (FileStorageException e) {
            log.error("❌ Download by fileUrl failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // ============================================
    // UPDATE OPERATIONS
    // ============================================

    @PutMapping(value = "/update/by-name", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Update file by fileName",
            description = "Replace existing file. Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<FileUploadResponse>> updateByFileName(
            @Parameter(description = "Old file name") @RequestParam String fileName,
            @Parameter(description = "Folder name") @RequestParam String folder,
            @Parameter(description = "New file") @RequestParam("file") MultipartFile newFile,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            FileUploadResponse response = fileService.updateByFileName(fileName, folder, newFile, language);
            String message = messageService.getMessage("file.update.success", language);
            return ResponseEntity.ok(ApiResponse.success(message, response));

        } catch (FileStorageException e) {
            String message = messageService.getMessage("file.update.failed", language);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(message + ": " + e.getMessage()));
        }
    }

    @PutMapping(value = "/update/by-url", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Update file by fileUrl",
            description = "Works with LOCAL, S3, Cloudinary. Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<FileUploadResponse>> updateByFileUrl(
            @Parameter(description = "Old file URL") @RequestParam String fileUrl,
            @Parameter(description = "New file") @RequestParam("file") MultipartFile newFile,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            FileUploadResponse response = fileService.updateByFileUrl(fileUrl, newFile, language);
            String message = messageService.getMessage("file.update.success", language);
            return ResponseEntity.ok(ApiResponse.success(message, response));

        } catch (FileStorageException e) {
            String message = messageService.getMessage("file.update.failed", language);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(message + ": " + e.getMessage()));
        }
    }

    // ============================================
    // DELETE OPERATIONS
    // ============================================

    @DeleteMapping("/delete/by-name")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Delete file by fileName",
            description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<Void>> deleteByFileName(
            @Parameter(description = "File name to delete") @RequestParam String fileName,
            @Parameter(description = "Folder name") @RequestParam String folder,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            boolean deleted = fileService.deleteByFileName(fileName, folder, language);

            if (deleted) {
                String message = messageService.getMessage("file.delete.success", language);
                return ResponseEntity.ok(ApiResponse.success(message, null));
            } else {
                String message = messageService.getMessage("file.not.found", language);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(message));
            }
        } catch (Exception e) {
            String message = messageService.getMessage("file.delete.failed", language);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(message));
        }
    }

    @DeleteMapping("/delete/by-url")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Delete file by fileUrl",
            description = "Works with LOCAL, S3, Cloudinary. Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<Void>> deleteByFileUrl(
            @Parameter(description = "File URL to delete") @RequestParam String fileUrl,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            boolean deleted = fileService.deleteByFileUrl(fileUrl, language);

            if (deleted) {
                String message = messageService.getMessage("file.delete.success", language);
                return ResponseEntity.ok(ApiResponse.success(message, null));
            } else {
                String message = messageService.getMessage("file.not.found", language);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(message));
            }
        } catch (Exception e) {
            String message = messageService.getMessage("file.delete.failed", language);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(message));
        }
    }

    // ============================================
    // CHECK EXISTENCE
    // ============================================

    @GetMapping("/exists/by-name")
    @Operation(summary = "Check file existence by fileName",
            description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<Boolean>> checkExistsByFileName(
            @Parameter(description = "File name") @RequestParam String fileName,
            @Parameter(description = "Folder name") @RequestParam String folder,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        boolean exists = fileService.checkExistsByFileName(fileName, folder);
        String message = messageService.getMessage(
                exists ? "file.exists" : "file.not.found",
                language
        );
        return ResponseEntity.ok(ApiResponse.success(message, exists));
    }

    @GetMapping("/exists/by-url")
    @Operation(summary = "Check file existence by fileUrl",
            description = "Multi-language: UZL, UZC, EN, RU")
    public ResponseEntity<ApiResponse<Boolean>> checkExistsByFileUrl(
            @Parameter(description = "File URL") @RequestParam String fileUrl,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        boolean exists = fileService.checkExistsByFileUrl(fileUrl);
        String message = messageService.getMessage(
                exists ? "file.exists" : "file.not.found",
                language
        );
        return ResponseEntity.ok(ApiResponse.success(message, exists));
    }

    // ============================================
    // SECURE QUESTION IMAGE ACCESS
    // ============================================

    @GetMapping("/questions/{filename:.+}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Savol rasmi (xavfsiz)",
            description = "Faqat aktiv imtihon paytida ko'rinadi. Admin har doim ko'rishi mumkin."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Rasm muvaffaqiyatli qaytarildi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "Noto'g'ri fayl nomi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "401",
                    description = "Autentifikatsiya talab qilinadi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Aktiv imtihon yo'q - rasm ko'rsatilmaydi"
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "Fayl o'qishda xatolik"
            )
    })
    public ResponseEntity<Resource> getQuestionImage(
            @PathVariable String filename,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        try {
            // Validate filename
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                log.warn("⚠️ Invalid filename attempt: {}", filename);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            Long userId = SecurityUtils.getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Check active exam
            boolean hasActiveExam = examSessionRepository
                    .findActiveSession(userId, LocalDateTime.now())
                    .isPresent();

            if (!hasActiveExam) {
                log.warn("⚠️ User {} tried to access question image without active exam", userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Use cached file service
            byte[] fileData = cachedFileService.getCachedFile("questions", filename);
            ByteArrayResource resource = new ByteArrayResource(fileData);
            String contentType = cachedFileService.getContentType("questions", filename);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentLength(fileData.length)
                    .body(resource);

        } catch (Exception e) {
            log.error("❌ Error reading question image: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============================================
    // PUBLIC FILE ACCESS
    // ============================================

    @GetMapping("/profiles/{filename:.+}")
    @Operation(summary = "Get profile image (public)")
    public ResponseEntity<Resource> getProfileImage(
            @PathVariable String filename,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        return getPublicFile("profiles", filename, language);
    }

    @GetMapping("/general/{filename:.+}")
    @Operation(summary = "Get general file (public)")
    public ResponseEntity<Resource> getGeneralFile(
            @PathVariable String filename,
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {
        return getPublicFile("general", filename, language);
    }

    // ============================================
    // UTILITY OPERATIONS
    // ============================================

    @GetMapping("/storage-type")
    @Operation(summary = "Get storage type")
    public ResponseEntity<ApiResponse<String>> getStorageType(
            @Parameter(description = "uzl|uzc|en|ru")
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        String storageType = fileStorageManager.getStorageType();
        String message = messageService.getMessage("file.storage.type", language);
        return ResponseEntity.ok(ApiResponse.success(message, storageType));
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private ResponseEntity<Resource> buildDownloadResponse(FileService.FileDownloadResult result) {
        ByteArrayResource resource = new ByteArrayResource(result.data());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.fileName() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                .contentLength(result.data().length)
                .body(resource);
    }

    private ResponseEntity<Resource> getPublicFile(String folder, String filename, AcceptLanguage language) {
        try {
            if (filename.contains("..")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            List<String> allowedFolders = Arrays.asList("profiles", "general");
            if (!allowedFolders.contains(folder)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            byte[] fileData = cachedFileService.getCachedFile(folder, filename);
            ByteArrayResource resource = new ByteArrayResource(fileData);
            String contentType = cachedFileService.getContentType(folder, filename);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .contentLength(fileData.length)
                    .body(resource);

        } catch (Exception e) {
            log.error("❌ Error reading file: {}/{}", folder, filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}