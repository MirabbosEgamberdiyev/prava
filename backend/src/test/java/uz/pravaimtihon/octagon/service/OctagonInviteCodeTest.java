package uz.pravaimtihon.octagon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import uz.pravaimtihon.exception.RateLimitExceededException;
import uz.pravaimtihon.octagon.dto.OctagonDtos.ChallengeResponse;
import uz.pravaimtihon.octagon.entity.OctagonChallenge;
import uz.pravaimtihon.octagon.enums.OctagonChallengeStatus;
import uz.pravaimtihon.octagon.repository.OctagonChallengeRepository;
import uz.pravaimtihon.octagon.repository.OctagonMatchRepository;
import uz.pravaimtihon.octagon.repository.OctagonProfileRepository;
import uz.pravaimtihon.octagon.repository.OctagonReportRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Octagon invite codes: 4-digit PIN, unique among active invites, freed after use/expiry")
class OctagonInviteCodeTest {

    private OctagonChallengeRepository challenges;
    private OctagonService service;

    @BeforeEach
    void setUp() {
        challenges = mock(OctagonChallengeRepository.class);
        service = new OctagonService(mock(OctagonProfileRepository.class), mock(OctagonMatchRepository.class), challenges,
                mock(OctagonReportRepository.class), mock(QuestionRepository.class), mock(UserRepository.class),
                mock(OctagonEloCalculator.class), mock(uz.pravaimtihon.payment.service.PaymentAccessService.class));
        when(challenges.findByChallengerIdAndStatus(anyString(), any())).thenReturn(List.of());
        when(challenges.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(anyString(), any())).thenReturn(Optional.empty());
        when(challenges.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static OctagonChallenge pending(String code, LocalDateTime expiresAt) {
        return OctagonChallenge.builder().id(UUID.randomUUID()).challengerId("9").inviteCode(code)
                .status(OctagonChallengeStatus.PENDING).createdAt(expiresAt.minusHours(1)).expiresAt(expiresAt).build();
    }

    @Test
    @DisplayName("createChallenge returns a 4-digit code and a pravaonline.uz/oktagon?code= link valid for 1 hour")
    void createsFourDigitCode() {
        ChallengeResponse res = service.createChallenge("1", null);

        assertTrue(res.getInviteCode().matches("[1-9][0-9]{3}"), res.getInviteCode());
        assertEquals("https://pravaonline.uz/oktagon?code=" + res.getInviteCode(), res.getInviteUrl());
        long minutes = ChronoUnit.MINUTES.between(LocalDateTime.now(), res.getExpiresAt());
        assertTrue(minutes >= 59 && minutes <= 60, "ttl " + minutes);
        ArgumentCaptor<OctagonChallenge> saved = ArgumentCaptor.forClass(OctagonChallenge.class);
        verify(challenges).saveAndFlush(saved.capture());
        assertEquals(OctagonChallengeStatus.PENDING, saved.getValue().getStatus());
    }

    @Test
    @DisplayName("A user has one active code: creating a new invite expires the previous ones")
    void previousInvitesExpire() {
        OctagonChallenge old = pending("1234", LocalDateTime.now().plusMinutes(30));
        when(challenges.findByChallengerIdAndStatus("1", OctagonChallengeStatus.PENDING)).thenReturn(List.of(old));

        service.createChallenge("1", null);

        assertEquals(OctagonChallengeStatus.EXPIRED, old.getStatus());
        verify(challenges).save(old);
    }

    @Test
    @DisplayName("Codes held by active invites are skipped; an expired holder releases its code")
    void collisionsAndRelease() {
        LocalDateTime now = LocalDateTime.now();
        OctagonChallenge active = pending("x", now.plusMinutes(10));
        when(challenges.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(anyString(), eq(OctagonChallengeStatus.PENDING)))
                .thenReturn(Optional.of(active), Optional.of(active), Optional.empty());
        assertNotNull(service.generateInviteCode(now));
        verify(challenges, times(3)).findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(anyString(), any());

        OctagonChallenge stale = pending("y", now.minusMinutes(1));
        when(challenges.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(anyString(), any())).thenReturn(Optional.of(stale));
        assertNotNull(service.generateInviteCode(now));
        assertEquals(OctagonChallengeStatus.EXPIRED, stale.getStatus());
    }

    @Test
    @DisplayName("After 25 occupied codes in a row the user gets a clear 'try again' error")
    void exhaustion() {
        OctagonChallenge active = pending("x", LocalDateTime.now().plusMinutes(10));
        when(challenges.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(anyString(), any())).thenReturn(Optional.of(active));
        assertThrows(RateLimitExceededException.class, () -> service.generateInviteCode(LocalDateTime.now()));
        verify(challenges, times(OctagonService.INVITE_CODE_ATTEMPTS)).findFirstByInviteCodeAndStatusOrderByCreatedAtDesc(anyString(), any());
    }

    @Test
    @DisplayName("Lookup normalizes spaces/case, rejects junk and ignores expired invites")
    void lookup() {
        assertEquals("4821", OctagonService.normalizeInviteCode(" 48 21 "));
        assertEquals("ABCDEFGH23", OctagonService.normalizeInviteCode("abcdefgh23"));
        assertNull(OctagonService.normalizeInviteCode("<script>"));
        assertNull(OctagonService.normalizeInviteCode("12"));
        assertTrue(service.getChallenge("<x>").isEmpty());

        OctagonChallenge live = pending("4821", LocalDateTime.now().plusMinutes(5));
        when(challenges.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc("4821", OctagonChallengeStatus.PENDING))
                .thenReturn(Optional.of(live));
        assertSame(live, service.getChallenge("48 21").orElseThrow());

        OctagonChallenge expired = pending("5555", LocalDateTime.now().minusMinutes(1));
        when(challenges.findFirstByInviteCodeAndStatusOrderByCreatedAtDesc("5555", OctagonChallengeStatus.PENDING))
                .thenReturn(Optional.of(expired));
        assertTrue(service.getChallenge("5555").isEmpty());
    }
}
