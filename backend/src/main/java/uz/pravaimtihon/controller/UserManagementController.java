package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.CreateUserRequest;
import uz.pravaimtihon.dto.request.UpdateUserRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.impl.UserManagementService;

/**
 * ✅ Foydalanuvchilar Boshqaruvi Controller - To'liq Multi-Language + i18n
 * Qo'llab-quvvatlanadigan tillar: UZL, UZC, EN, RU
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Foydalanuvchilarni boshqarish, rol o'zgartirish, bloklash")
public class UserManagementController {

    private final UserManagementService userManagementService;
    private final MessageService messageService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Foydalanuvchilar ro'yxati",
            description = "Filtrlash: search, role, isActive. Sahifalash va saralash mavjud."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Foydalanuvchilar ro'yxati",
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "success": true,
                                      "data": {
                                        "content": [
                                          {
                                            "id": 1,
                                            "firstName": "Ali",
                                            "lastName": "Valiyev",
                                            "phone": "+998901234567",
                                            "email": "ali@example.com",
                                            "role": "USER",
                                            "isActive": true,
                                            "createdAt": "2024-01-15T10:00:00"
                                          }
                                        ],
                                        "totalElements": 100,
                                        "totalPages": 5,
                                        "number": 0,
                                        "size": 20
                                      }
                                    }
                                    """)
                    )
            ),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Autentifikatsiya talab qilinadi"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Ruxsat yo'q")
    })
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean isActive,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<UserResponse> users = userManagementService.getAllUsers(
                pageable, search, role, isActive, language
        );

        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get all admins", description = "Only SUPER_ADMIN can view all admins")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<UserResponse> admins = userManagementService.getAllAdmins(pageable, language);
        return ResponseEntity.ok(ApiResponse.success(admins));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserResponse user = userManagementService.getUserById(id, language);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create new user", description = "Only SUPER_ADMIN can create any role")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserResponse user = userManagementService.createUser(request, language);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messageService.getMessage("success.user.created", language), user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Update user", description = "ADMIN can only update USER role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserResponse user = userManagementService.updateUser(id, request, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.user.updated", language), user));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Change user role", description = "Only SUPER_ADMIN can change roles")
    public ResponseEntity<ApiResponse<UserResponse>> changeUserRole(
            @PathVariable Long id,
            @RequestParam Role newRole,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserResponse user = userManagementService.changeUserRole(id, newRole, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.user.role.changed", language), user));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Activate/Deactivate user")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(
            @PathVariable Long id,
            @RequestParam Boolean isActive,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        UserResponse user = userManagementService.toggleUserStatus(id, isActive, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.user.status.updated", language), user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Delete user (soft delete)", description = "Only SUPER_ADMIN can delete users")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        userManagementService.deleteUser(id, language);
        return ResponseEntity.ok(ApiResponse.success(messageService.getMessage("success.user.deleted", language), null));
    }
}