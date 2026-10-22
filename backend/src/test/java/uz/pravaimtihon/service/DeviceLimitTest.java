package uz.pravaimtihon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import uz.pravaimtihon.entity.RefreshToken;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.security.SessionRevocationService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Device limit: 2 devices per account, oldest sessions are signed out")
class DeviceLimitTest {

    private UserRepository users;
    private RefreshTokenRepository tokens;
    private SessionRevocationService revocation;
    private DeviceManagementService service;
    private User user;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        tokens = mock(RefreshTokenRepository.class);
        revocation = mock(SessionRevocationService.class);
        service = new DeviceManagementService(users, tokens, revocation);
        user = User.builder().phoneNumber("998901234567").role(Role.USER).build();
        user.setId(7L);
        when(users.findById(7L)).thenReturn(Optional.of(user));
    }

    private static RefreshToken token(String family) {
        return RefreshToken.builder().token("t-" + family).tokenFamily(family)
                .expiresAt(LocalDateTime.now().plusDays(10)).createdAt(LocalDateTime.now()).isRevoked(false).build();
    }

    @Test
    @DisplayName("New accounts default to 2 devices")
    void defaultIsTwo() {
        assertEquals(2, DeviceManagementService.DEFAULT_MAX_DEVICES);
        assertEquals(2, User.builder().phoneNumber("998900000000").build().getMaxDevices());
        User legacy = User.builder().phoneNumber("998900000001").build();
        legacy.setMaxDevices(null);
        service.initializeDeviceSettings(legacy);
        assertEquals(2, legacy.getMaxDevices());
    }

    @Test
    @DisplayName("Below the limit nothing is revoked")
    void belowLimit() {
        when(tokens.countActiveTokensByUserId(eq(7L), any())).thenReturn(1);
        service.registerNewDevice(7L);
        verify(tokens, never()).revokeAllByFamily(anyString(), any());
        assertEquals(2, user.getActiveDeviceCount());
    }

    @Test
    @DisplayName("At the limit: the least recently refreshed device is signed out (whole session + access-token cache)")
    void atLimitKicksOldest() {
        when(tokens.countActiveTokensByUserId(eq(7L), any())).thenReturn(2);
        when(tokens.findOldestActiveTokensByUserId(eq(7L), any(), any(Pageable.class))).thenReturn(List.of(token("old")));

        service.registerNewDevice(7L);

        verify(tokens).findOldestActiveTokensByUserId(eq(7L), any(), argThat(p -> p.getPageSize() == 1));
        verify(tokens).revokeAllByFamily(eq("old"), any());
        verify(revocation).evict("old");
        assertEquals(2, user.getActiveDeviceCount());
    }

    @Test
    @DisplayName("Legacy accounts with 4 sessions drop to 2 on the next sign-in (3 oldest go, new one stays)")
    void legacyOverflowIsTrimmed() {
        user.setMaxDevices(2);
        when(tokens.countActiveTokensByUserId(eq(7L), any())).thenReturn(4);
        List<RefreshToken> oldest = IntStream.range(0, 3).mapToObj(i -> token("f" + i)).toList();
        when(tokens.findOldestActiveTokensByUserId(eq(7L), any(), argThat(p -> p.getPageSize() == 3))).thenReturn(oldest);

        service.registerNewDevice(7L);

        for (int i = 0; i < 3; i++) {
            verify(tokens).revokeAllByFamily(eq("f" + i), any());
            verify(revocation).evict("f" + i);
        }
        assertEquals(2, user.getActiveDeviceCount());
    }
}
