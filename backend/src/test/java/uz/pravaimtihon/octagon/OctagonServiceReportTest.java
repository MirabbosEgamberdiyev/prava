package uz.pravaimtihon.octagon;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uz.pravaimtihon.octagon.dto.OctagonDtos.ReportRequest;
import uz.pravaimtihon.octagon.entity.OctagonReport;
import uz.pravaimtihon.octagon.repository.*;
import uz.pravaimtihon.octagon.service.OctagonEloCalculator;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.UserRepository;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("Octagon Abuse Reporting & Audit Tests")
class OctagonServiceReportTest {

    @Test
    @DisplayName("Should successfully record and audit abuse reports")
    void testSubmitAbuseReport() {
        OctagonProfileRepository profileRepo = mock(OctagonProfileRepository.class);
        OctagonMatchRepository matchRepo = mock(OctagonMatchRepository.class);
        OctagonChallengeRepository challengeRepo = mock(OctagonChallengeRepository.class);
        OctagonReportRepository reportRepo = mock(OctagonReportRepository.class);
        QuestionRepository questionRepo = mock(QuestionRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        OctagonEloCalculator eloCalc = mock(OctagonEloCalculator.class);

        OctagonService service = new OctagonService(
                profileRepo, matchRepo, challengeRepo, reportRepo,
                questionRepo, userRepo, eloCalc
        );

        ReportRequest request = ReportRequest.builder()
                .matchId("match-xyz-123")
                .reportedUserId("cheater_99")
                .reason("CHEATING")
                .comment("Player had impossible 1ms reaction time on 10 consecutive complex questions")
                .build();

        service.submitReport("user_42", request);

        verify(reportRepo, times(1)).save(any(OctagonReport.class));
    }
}
