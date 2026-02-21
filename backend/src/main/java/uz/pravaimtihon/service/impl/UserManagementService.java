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
}