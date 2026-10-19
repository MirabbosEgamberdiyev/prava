package uz.pravaimtihon.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import uz.pravaimtihon.dto.mapper.UserMapper;
import uz.pravaimtihon.dto.response.UserResponse;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.exception.ValidationException;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.CustomUserDetails;
import uz.pravaimtihon.security.JwtTokenProvider;
import uz.pravaimtihon.service.impl.AuthService;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("AuthService Profile Update Unit Tests")
class AuthServiceUpdateProfileTest {

    private UserRepository userRepository;
    private UserMapper userMapper;
    private AuthService authService;
    private User existingUser;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        JwtTokenProvider jwtTokenProvider = mock(JwtTokenProvider.class);
        userMapper = mock(UserMapper.class);
        MessageService messageService = mock(MessageService.class);
        GoogleOAuthService googleOAuthService = mock(GoogleOAuthService.class);
        TelegramAuthService telegramAuthService = mock(TelegramAuthService.class);
        TelegramTokenStore telegramTokenStore = mock(TelegramTokenStore.class);
        DeviceManagementService deviceManagementService = mock(DeviceManagementService.class);

        authService = new AuthService(
                userRepository,
                refreshTokenRepository,
                passwordEncoder,
                jwtTokenProvider,
                userMapper,
                messageService,
                googleOAuthService,
                telegramAuthService,
                telegramTokenStore,
                deviceManagementService
        );

        existingUser = User.builder()
                .firstName("Eski")
                .lastName("Ism")
                .phoneNumber("998901234567")
                .role(Role.USER)
                .preferredLanguage(AcceptLanguage.UZL)
                .build();
        existingUser.setId(10L);
        existingUser.setIsActive(true);
        existingUser.setDeleted(false);

        CustomUserDetails userDetails = CustomUserDetails.from(existingUser);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
        );

        when(userRepository.findById(10L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should successfully update full name with two words")
    void testUpdateFullNameTwoWords() {
        when(userMapper.toResponse(any(User.class), any(AcceptLanguage.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return UserResponse.builder()
                    .id(u.getId())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .fullName(u.getFullName())
                    .preferredLanguage(u.getPreferredLanguage())
                    .build();
        });

        Map<String, String> body = new HashMap<>();
        body.put("fullName", "Javohir Bozorboyev");

        UserResponse res = authService.updateMyProfile(body, AcceptLanguage.UZL);

        assertNotNull(res);
        assertEquals("Javohir", res.getFirstName());
        assertEquals("Bozorboyev", res.getLastName());
        assertEquals("Javohir Bozorboyev", res.getFullName());
        verify(userRepository, times(1)).save(existingUser);
    }

    @Test
    @DisplayName("Should successfully update single word full name")
    void testUpdateFullNameSingleWord() {
        when(userMapper.toResponse(any(User.class), any(AcceptLanguage.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return UserResponse.builder()
                    .id(u.getId())
                    .firstName(u.getFirstName())
                    .lastName(u.getLastName())
                    .fullName(u.getFullName())
                    .preferredLanguage(u.getPreferredLanguage())
                    .build();
        });

        Map<String, String> body = new HashMap<>();
        body.put("fullName", "Sardor");

        UserResponse res = authService.updateMyProfile(body, AcceptLanguage.UZL);

        assertNotNull(res);
        assertEquals("Sardor", res.getFirstName());
        assertNull(res.getLastName());
        assertEquals("Sardor", res.getFullName());
    }

    @Test
    @DisplayName("Should reject invalid or too short full name")
    void testUpdateFullNameTooShort() {
        Map<String, String> body = new HashMap<>();
        body.put("fullName", "A");

        assertThrows(ValidationException.class, () -> {
            authService.updateMyProfile(body, AcceptLanguage.UZL);
        });
    }

    @Test
    @DisplayName("Should reject empty request body")
    void testUpdateEmptyBody() {
        Map<String, String> body = new HashMap<>();

        assertThrows(ValidationException.class, () -> {
            authService.updateMyProfile(body, AcceptLanguage.UZL);
        });
    }
}
