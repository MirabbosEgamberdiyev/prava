package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.mapper.UserMapper;
import uz.pravaimtihon.dto.request.CreateUserRequest;
import uz.pravaimtihon.dto.request.UpdateUserRequest;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ConflictException;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.SecurityUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * ✅ User Management Service
 * Role-based user management logic
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final uz.pravaimtihon.repository.RefreshTokenRepository refreshTokenRepository;

    /**
     * ✅ Get all users with filters and pagination
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(
            Pageable pageable,
            String search,
            Role role,
            Boolean isActive,
            AcceptLanguage language
    ) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = getUserOrThrow(currentUserId);

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Not deleted
            predicates.add(cb.isFalse(root.get("deleted")));

            // Search by name, email, or phone
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), searchPattern),
                        cb.like(cb.lower(root.get("lastName")), searchPattern),
                        cb.like(cb.lower(root.get("email")), searchPattern),
                        cb.like(root.get("phoneNumber"), searchPattern)
                ));
            }

            // Filter by role
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            // Filter by active status
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            // ADMIN can only see USER role
            if (currentUser.getRole() == Role.ADMIN) {
                predicates.add(cb.equal(root.get("role"), Role.USER));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable)
                .map(user -> userMapper.toResponse(user, language));
    }

    /**
     * ✅ Get user by ID
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id, AcceptLanguage language) {
        User currentUser = getCurrentUser();
        User targetUser = getUserOrThrow(id);

        validateAccessToUser(currentUser, targetUser);

        return userMapper.toResponse(targetUser, language);
    }

    /**
     * ✅ Create new user
     * Only SUPER_ADMIN can create any role
     */
    public UserResponse createUser(CreateUserRequest request, AcceptLanguage language) {
        User currentUser = getCurrentUser();

        // Only SUPER_ADMIN can create users
        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new ForbiddenException("error.permission.denied");
        }

        // Normalize phone number - strip + prefix
        String phone = request.getPhoneNumber();
        if (phone != null && phone.startsWith("+")) {
            phone = phone.substring(1);
        }

        // Check if user already exists
        String identifier = phone != null ? phone : request.getEmail();

        if (userRepository.findByIdentifier(identifier).isPresent()) {
            throw new ConflictException(
                    phone != null
                            ? "error.user.phone.exists"
                            : "error.user.email.exists"
            );
        }

        // Create user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(phone)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.USER)
                .preferredLanguage(request.getPreferredLanguage() != null
                        ? request.getPreferredLanguage()
                        : AcceptLanguage.UZL)
                .isActive(true)
                .isEmailVerified(request.getEmail() != null)
                .isPhoneVerified(request.getPhoneNumber() != null)
                .build();

        user = userRepository.save(user);
        log.info("User created by SUPER_ADMIN: {}", user.getId());

        return userMapper.toResponse(user, language);
    }

    /**
     * ✅ Update user
     * ADMIN can only update USER role
     */
    public UserResponse updateUser(Long id, UpdateUserRequest request, AcceptLanguage language) {
        User currentUser = getCurrentUser();
        User targetUser = getUserOrThrow(id);

        validateAccessToUser(currentUser, targetUser);

        // Update fields
        if (request.getFirstName() != null) {
            targetUser.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            targetUser.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            String normalizedPhone = request.getPhoneNumber().startsWith("+")
                    ? request.getPhoneNumber().substring(1)
                    : request.getPhoneNumber();
            if (!normalizedPhone.equals(targetUser.getPhoneNumber())) {
                if (userRepository.findByIdentifier(normalizedPhone).isPresent()) {
                    throw new ConflictException("error.user.phone.exists");
                }
                targetUser.setPhoneNumber(normalizedPhone);
            }
        }
        if (request.getEmail() != null && !request.getEmail().equals(targetUser.getEmail())) {
            if (userRepository.findByIdentifier(request.getEmail()).isPresent()) {
                throw new ConflictException("error.user.email.exists");
            }
            targetUser.setEmail(request.getEmail());
        }
        if (request.getPreferredLanguage() != null) {
            targetUser.setPreferredLanguage(request.getPreferredLanguage());
        }

        targetUser = userRepository.save(targetUser);
        log.info("User updated: {}", targetUser.getId());

        return userMapper.toResponse(targetUser, language);
    }

    /**
     * ✅ Change user role
     * Only SUPER_ADMIN can change roles
     */
    public UserResponse changeUserRole(Long id, Role newRole, AcceptLanguage language) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new ForbiddenException("error.permission.denied");
        }

        User targetUser = getUserOrThrow(id);

        // Cannot change own role
        if (targetUser.getId().equals(currentUser.getId())) {
            throw new BusinessException("error.user.cannot.change.own.role");
        }

        targetUser.setRole(newRole);
        targetUser = userRepository.save(targetUser);

        log.info("User role changed: {} -> {}", targetUser.getId(), newRole);

        return userMapper.toResponse(targetUser, language);
    }

    /**
     * ✅ Toggle user active status
     */
    public UserResponse toggleUserStatus(Long id, Boolean isActive, AcceptLanguage language) {
        User currentUser = getCurrentUser();
        User targetUser = getUserOrThrow(id);

        validateAccessToUser(currentUser, targetUser);

        // Cannot deactivate own account
        if (targetUser.getId().equals(currentUser.getId())) {
            throw new BusinessException("error.user.cannot.deactivate.self");
        }

        targetUser.setIsActive(isActive);
        targetUser = userRepository.save(targetUser);
        if (!Boolean.TRUE.equals(isActive)) {
            // Bloklangan foydalanuvchining barcha sessiyalari yopiladi (access token ham rad etiladi).
            refreshTokenRepository.revokeAllByUserId(targetUser.getId(), java.time.LocalDateTime.now());
        }

        log.info("User status changed: {} -> {}", targetUser.getId(), isActive);

        return userMapper.toResponse(targetUser, language);
    }

    /**
     * ✅ Delete user (soft delete)
     * Only SUPER_ADMIN can delete
     */
    public void deleteUser(Long id, AcceptLanguage language) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new ForbiddenException("error.permission.denied");
        }

        User targetUser = getUserOrThrow(id);

        // Cannot delete own account
        if (targetUser.getId().equals(currentUser.getId())) {
            throw new BusinessException("error.user.cannot.delete.self");
        }

        targetUser.softDelete(currentUser.getEmail() != null ? currentUser.getEmail() : currentUser.getPhoneNumber());
        userRepository.save(targetUser);

        log.info("User deleted: {}", targetUser.getId());
    }

    /**
     * ✅ Get all admins (SUPER_ADMIN and ADMIN)
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllAdmins(Pageable pageable, AcceptLanguage language) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new ForbiddenException("error.permission.denied");
        }

        Specification<User> spec = (root, query, cb) -> cb.and(
                cb.isFalse(root.get("deleted")),
                cb.or(
                        cb.equal(root.get("role"), Role.SUPER_ADMIN),
                        cb.equal(root.get("role"), Role.ADMIN)
                )
        );

        return userRepository.findAll(spec, pageable)
                .map(user -> userMapper.toResponse(user, language));
    }

    // ============================================
    // ✅ Helper Methods
    // ============================================

    private User getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new BusinessException("error.auth.required");
        }
        return getUserOrThrow(userId);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .filter(user -> !user.getDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not.found"));
    }

    private void validateAccessToUser(User currentUser, User targetUser) {
        // SUPER_ADMIN can access anyone
        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            return;
        }

        // ADMIN can only access USER role
        if (currentUser.getRole() == Role.ADMIN) {
            if (targetUser.getRole() != Role.USER) {
                throw new ForbiddenException("error.permission.denied");
            }
            return;
        }

        // USER can only access themselves
        if (!currentUser.getId().equals(targetUser.getId())) {
            throw new ForbiddenException("error.permission.denied");
        }
    }

    public void resetPassword(Long userId, String newPassword) {
        User user = getUserOrThrow(userId);
        validateAccessToUser(getCurrentUser(), user);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(userId, java.time.LocalDateTime.now());
        log.info("Password reset by admin for user id: {}", userId);
    }

    public void forceLogout(Long userId) {
        User user = getUserOrThrow(userId);
        validateAccessToUser(getCurrentUser(), user);
        refreshTokenRepository.deleteAllByUserId(user.getId());
        log.info("Force logout executed for user id: {}", userId);
    }

    public void bulkUpdateStatus(List<Long> ids, boolean isActive) {
        if (ids == null || ids.isEmpty()) return;
        List<User> users = userRepository.findAllById(ids);
        User current = getCurrentUser();
        users.forEach(u -> validateAccessToUser(current, u)); // ADMIN SUPER_ADMIN ga ta'sir qila olmaydi
        for (User u : users) {
            if (!Boolean.TRUE.equals(u.getDeleted())) {
                u.setIsActive(isActive);
                if (!isActive) {
                    refreshTokenRepository.deleteAllByUserId(u.getId());
                }
            }
        }
        userRepository.saveAll(users);
        log.info("Bulk status update (isActive={}) applied for {} users", isActive, users.size());
    }

    public void bulkDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        List<User> users = userRepository.findAllById(ids);
        User current = getCurrentUser();
        users.forEach(u -> validateAccessToUser(current, u));
        for (User u : users) {
            u.setDeleted(true);
            refreshTokenRepository.deleteAllByUserId(u.getId());
        }
        userRepository.saveAll(users);
        log.info("Bulk delete applied for {} users", users.size());
    }

    @Transactional(readOnly = true)
    public byte[] exportUsersCsv() {
        List<User> allUsers = userRepository.findAll().stream()
                .filter(u -> !Boolean.TRUE.equals(u.getDeleted()))
                .toList();

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM so Microsoft Excel opens special characters correctly
        sb.append("\uFEFF");
        sb.append("ID,First Name,Last Name,Phone,Email,Role,Is Active,Created At\n");

        for (User u : allUsers) {
            sb.append(u.getId()).append(",");
            sb.append(escapeCsv(u.getFirstName())).append(",");
            sb.append(escapeCsv(u.getLastName())).append(",");
            sb.append(escapeCsv(u.getPhoneNumber())).append(",");
            sb.append(escapeCsv(u.getEmail())).append(",");
            sb.append(u.getRole() != null ? u.getRole().name() : "").append(",");
            sb.append(Boolean.TRUE.equals(u.getIsActive()) ? "Active" : "Blocked").append(",");
            sb.append(u.getCreatedAt() != null ? u.getCreatedAt().toString() : "").append("\n");
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}