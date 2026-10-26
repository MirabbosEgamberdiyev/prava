package uz.pravaimtihon.octagon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uz.pravaimtihon.octagon.dto.OctagonDtos.LeaderboardEntry;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.repository.OctagonChallengeRepository;
import uz.pravaimtihon.octagon.repository.OctagonMatchRepository;
import uz.pravaimtihon.octagon.repository.OctagonProfileRepository;
import uz.pravaimtihon.octagon.repository.OctagonReportRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Leaderboard: the caller's own position (shown pinned under the table)")
class OctagonLeaderboardMeTest {

    private OctagonProfileRepository profiles;
    private OctagonService service;

    @BeforeEach
    void setUp() {
        profiles = mock(OctagonProfileRepository.class);
        service = new OctagonService(profiles, mock(OctagonMatchRepository.class), mock(OctagonChallengeRepository.class),
                mock(OctagonReportRepository.class), mock(QuestionRepository.class), mock(UserRepository.class),
                mock(OctagonEloCalculator.class), mock(uz.pravaimtihon.payment.service.PaymentAccessService.class));
    }

    private static OctagonProfile profile(int elo, int wins, int total, LocalDateTime updatedAt) {
        return OctagonProfile.builder().userId("7").eloRating(elo).rank(OctagonRank.fromElo(elo))
                .wins(wins).losses(total - wins).draws(0).totalMatches(total).updatedAt(updatedAt).build();
    }

    @Test
    @DisplayName("All-time position = players ahead (higher ELO, or same ELO and more wins) + 1")
    void allTimePosition() {
        when(profiles.findById("7")).thenReturn(Optional.of(profile(320, 9, 12, LocalDateTime.now())));
        when(profiles.countAhead(320, 9)).thenReturn(41L);

        LeaderboardEntry me = service.getMyLeaderboardPosition("7", "all_time").orElseThrow();
        assertEquals(42, me.getPosition());
        assertEquals(320, me.getEloRating());
        assertEquals(OctagonRank.PLATINUM, me.getRank());
        assertEquals(75.0, me.getWinRate());
    }

    @Test
    @DisplayName("Weekly: only players active this week count; inactive caller is not ranked")
    void weekly() {
        when(profiles.findById("7")).thenReturn(Optional.of(profile(120, 3, 5, LocalDateTime.now().minusDays(2))));
        when(profiles.countAheadSince(any(), eq(120), eq(3))).thenReturn(4L);
        assertEquals(5, service.getMyLeaderboardPosition("7", "weekly").orElseThrow().getPosition());

        when(profiles.findById("7")).thenReturn(Optional.of(profile(120, 3, 5, LocalDateTime.now().minusDays(9))));
        assertTrue(service.getMyLeaderboardPosition("7", "weekly").isEmpty());
    }

    @Test
    @DisplayName("No matches played, no profile, or a bot id — not ranked")
    void notRanked() {
        when(profiles.findById("7")).thenReturn(Optional.of(profile(0, 0, 0, LocalDateTime.now())));
        assertTrue(service.getMyLeaderboardPosition("7", "all_time").isEmpty());
        when(profiles.findById("8")).thenReturn(Optional.empty());
        assertTrue(service.getMyLeaderboardPosition("8", "all_time").isEmpty());
        assertTrue(service.getMyLeaderboardPosition("bot_01_abcdef", "all_time").isEmpty());
        verify(profiles, never()).countAhead(anyInt(), anyInt());
    }
}
