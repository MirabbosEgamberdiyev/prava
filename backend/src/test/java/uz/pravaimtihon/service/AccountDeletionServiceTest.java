package uz.pravaimtihon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.Role;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.payment.repository.UserPackageAccessRepository;
import uz.pravaimtihon.repository.RefreshTokenRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.repository.UserSavedQuestionRepository;
import uz.pravaimtihon.repository.UserStatisticsRepository;
import uz.pravaimtihon.repository.UserWrongAnswerRepository;
import uz.pravaimtihon.service.impl.AccountDeletionService;
import uz.pravaimtihon.simulator.repository.SimulatorSessionRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AccountDeletionServiceTest {

    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private UserStatisticsRepository statisticsRepository;
    private UserSavedQuestionRepository savedRepository;
    private UserWrongAnswerRepository wrongRepository;
    private UserPackageAccessRepository accessRepository;
    private SimulatorSessionRepository simulatorRepository;
    private AccountDeletionService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        statisticsRepository = mock(UserStatisticsRepository.class);
        savedRepository = mock(UserSavedQuestionRepository.class);
        wrongRepository = mock(UserWrongAnswerRepository.class);
        accessRepository = mock(UserPackageAccessRepository.class);
        simulatorRepository = mock(SimulatorSessionRepository.class);
        service = new AccountDeletionService(userRepository, refreshTokenRepository, statisticsRepository,
                savedRepository, wrongRepository, accessRepository, simulatorRepository);
    }

    private User user(Role role) {
        User u = User.builder()
                .firstName("Ali").lastName("Valiyev")
                .phoneNumber("998901234567").email("ali@example.com")
                .googleId("g-1").telegramId("t-1").telegramUsername("ali")
                .passwordHash("hash").profileImageUrl("/a.jpg")
                .role(role).isActive(true)
                .examSessions(new ArrayList<>(List.of(new ExamSession())))
                .refreshTokens(new ArrayList<>())
                .build();
        u.setId(7L);
        u.setDeleted(false);
        return u;
    }

    @Test
    void erasesLearningDataAndAnonymizesProfile() {
        User u = user(Role.USER);
        when(userRepository.findById(7L)).thenReturn(Optional.of(u));

        service.deleteOwnAccount(7L);

        verify(refreshTokenRepository).deleteAllByUserId(7L);
        verify(savedRepository).deleteAllByUserId(7L);
        verify(wrongRepository).deleteAllByUserId(7L);
        verify(statisticsRepository).deleteAll(any());
        verify(accessRepository).deleteAll(any());
        verify(simulatorRepository).deleteAll(any());
        verify(userRepository).save(u);

        assertTrue(u.getExamSessions().isEmpty());
        assertTrue(u.getDeleted());
        assertFalse(u.getIsActive());
        assertNull(u.getPhoneNumber());
        assertNull(u.getGoogleId());
        assertNull(u.getTelegramId());
        assertNull(u.getTelegramUsername());
        assertNull(u.getPasswordHash());
        assertNull(u.getProfileImageUrl());
        assertNull(u.getLastName());
        assertEquals("deleted-7@deleted.invalid", u.getEmail());
        assertNotEquals("Ali", u.getFirstName());
    }

    @Test
    void staffAccountsCannotSelfDelete() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user(Role.ADMIN)));
        assertThrows(ForbiddenException.class, () -> service.deleteOwnAccount(7L));
        verify(userRepository, never()).save(any());
        verifyNoInteractions(refreshTokenRepository, savedRepository, wrongRepository);
    }

    @Test
    void alreadyDeletedUserIsNotFound() {
        User u = user(Role.USER);
        u.setDeleted(true);
        when(userRepository.findById(7L)).thenReturn(Optional.of(u));
        assertThrows(ResourceNotFoundException.class, () -> service.deleteOwnAccount(7L));
        verify(userRepository, never()).save(any());
    }
}
