package uz.pravaimtihon.simulator.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.simulator.dto.*;
import uz.pravaimtihon.simulator.entity.*;
import uz.pravaimtihon.simulator.enums.SimulatorMode;
import uz.pravaimtihon.simulator.enums.SimulatorSessionStatus;
import uz.pravaimtihon.simulator.repository.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulatorServiceImpl implements SimulatorService {

    private final SimulatorSessionRepository sessionRepository;
    private final SimulatorExerciseResultRepository exerciseResultRepository;
    private final SimulatorPenaltyEventRepository penaltyEventRepository;
    private final SimulatorExerciseConfigRepository exerciseConfigRepository;
    private final SimulatorVehicleConfigRepository vehicleConfigRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public SimulatorSessionResponse createSession(Long userId, StartSimulatorSessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        SimulatorSession session = SimulatorSession.builder()
                .user(user)
                .mode(request.getMode())
                .status(SimulatorSessionStatus.RUNNING)
                .totalPenaltyPoints(0)
                .isPassed(false)
                .timeSpentSeconds(0)
                .startedAt(LocalDateTime.now())
                .vehicleModel(request.getVehicleModel() != null ? request.getVehicleModel() : "Chevrolet Cobalt")
                .build();

        SimulatorSession saved = sessionRepository.save(session);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SimulatorSessionResponse getSession(Long sessionId) {
        SimulatorSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulator session not found with id: " + sessionId));
        return mapToResponse(session);
    }

    @Override
    @Transactional
    public void recordPenalty(Long sessionId, RecordSimulatorPenaltyRequest request) {
        SimulatorSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulator session not found with id: " + sessionId));

        SimulatorPenaltyEvent event = SimulatorPenaltyEvent.builder()
                .session(session)
                .exerciseNumber(request.getExerciseNumber())
                .ruleCode(request.getRuleCode())
                .points(request.getPoints())
                .posX(request.getPosX())
                .posY(request.getPosY())
                .occurredAtSeconds(request.getOccurredAtSeconds() != null ? request.getOccurredAtSeconds() : 0)
                .build();

        penaltyEventRepository.save(event);

        int updatedTotal = (session.getTotalPenaltyPoints() != null ? session.getTotalPenaltyPoints() : 0) + request.getPoints();
        session.setTotalPenaltyPoints(updatedTotal);

        if (session.getMode() == SimulatorMode.EXAM && updatedTotal >= 100) {
            session.setStatus(SimulatorSessionStatus.FAILED);
            session.setIsPassed(false);
        }

        sessionRepository.save(session);
    }

    @Override
    @Transactional
    public SimulatorSessionResponse finishSession(Long sessionId, FinishSimulatorSessionRequest request) {
        SimulatorSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulator session not found with id: " + sessionId));

        int totalPenalty = request.getTotalPenaltyPoints() != null ? request.getTotalPenaltyPoints() : 0;
        session.setTotalPenaltyPoints(totalPenalty);
        session.setTimeSpentSeconds(request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds() : 0);
        session.setFinishedAt(LocalDateTime.now());

        // Server-side state exam integrity validation: 100-point threshold
        boolean passed = Boolean.TRUE.equals(request.getIsPassed()) && (session.getMode() != SimulatorMode.EXAM || totalPenalty < 100);
        session.setIsPassed(passed);
        session.setStatus(passed ? SimulatorSessionStatus.COMPLETED : SimulatorSessionStatus.FAILED);

        if (request.getExerciseResults() != null && !request.getExerciseResults().isEmpty()) {
            for (SimulatorExerciseResultDto dto : request.getExerciseResults()) {
                SimulatorExerciseResult res = SimulatorExerciseResult.builder()
                        .session(session)
                        .exerciseNumber(dto.getExerciseNumber())
                        .isPassed(dto.getIsPassed() != null ? dto.getIsPassed() : false)
                        .penaltyPoints(dto.getPenaltyPoints() != null ? dto.getPenaltyPoints() : 0)
                        .timeSpentSeconds(dto.getTimeSpentSeconds() != null ? dto.getTimeSpentSeconds() : 0)
                        .build();
                exerciseResultRepository.save(res);
            }
        }

        SimulatorSession saved = sessionRepository.save(session);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SimulatorStatisticsDto getUserStatistics(Long userId) {
        Long total = sessionRepository.countSessionsByUserId(userId);
        Long passed = sessionRepository.countPassedSessionsByUserId(userId);
        Long failed = total - passed;
        Double avgScore = sessionRepository.getAverageScoreByUserId(userId);
        Integer bestScore = sessionRepository.getBestScoreByUserId(userId);
        Double avgTime = sessionRepository.getAverageTimeByUserId(userId);
        Double passRate = total > 0 ? (passed.doubleValue() / total.doubleValue()) * 100.0 : 0.0;

        List<WeakExerciseDto> weakExercises = getWeakExercises(userId);

        return SimulatorStatisticsDto.builder()
                .totalSessions(total)
                .passedSessions(passed)
                .failedSessions(failed)
                .passRate(Math.round(passRate * 10.0) / 10.0)
                .averageScore(Math.round(avgScore * 10.0) / 10.0)
                .bestScore(bestScore)
                .averageTimeSeconds(Math.round(avgTime * 10.0) / 10.0)
                .weakExercises(weakExercises)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeakExerciseDto> getWeakExercises(Long userId) {
        List<Object[]> rawList = exerciseResultRepository.findWeakExercisesByUserId(userId);
        List<WeakExerciseDto> dtoList = new ArrayList<>();

        for (Object[] row : rawList) {
            Integer exNum = (Integer) row[0];
            Long count = ((Number) row[1]).longValue();

            SimulatorExerciseConfig config = exerciseConfigRepository.findByExerciseNumber(exNum).orElse(null);

            dtoList.add(WeakExerciseDto.builder()
                    .exerciseNumber(exNum)
                    .exerciseCode(config != null ? config.getCode() : "EXERCISE_" + exNum)
                    .titleUzl(config != null ? config.getTitleUzl() : exNum + "-mashq")
                    .titleUzc(config != null ? config.getTitleUzc() : exNum + "-машқ")
                    .titleRu(config != null ? config.getTitleRu() : "Упражнение " + exNum)
                    .failCount(count)
                    .build());
        }

        return dtoList;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SimulatorExerciseConfig> getActiveExercises() {
        return exerciseConfigRepository.findByIsActiveTrueOrderByExerciseNumberAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SimulatorVehicleConfig> getVehicleConfigs() {
        return vehicleConfigRepository.findAll();
    }

    private SimulatorSessionResponse mapToResponse(SimulatorSession session) {
        List<SimulatorExerciseResultDto> results = session.getExerciseResults() != null
                ? session.getExerciseResults().stream()
                .map(r -> SimulatorExerciseResultDto.builder()
                        .exerciseNumber(r.getExerciseNumber())
                        .isPassed(r.getIsPassed())
                        .penaltyPoints(r.getPenaltyPoints())
                        .timeSpentSeconds(r.getTimeSpentSeconds())
                        .build())
                .collect(Collectors.toList())
                : new ArrayList<>();

        List<SimulatorPenaltyEventDto> penalties = session.getPenaltyEvents() != null
                ? session.getPenaltyEvents().stream()
                .map(p -> SimulatorPenaltyEventDto.builder()
                        .id(p.getId())
                        .exerciseNumber(p.getExerciseNumber())
                        .ruleCode(p.getRuleCode())
                        .points(p.getPoints())
                        .posX(p.getPosX())
                        .posY(p.getPosY())
                        .occurredAtSeconds(p.getOccurredAtSeconds())
                        .build())
                .collect(Collectors.toList())
                : new ArrayList<>();

        return SimulatorSessionResponse.builder()
                .id(session.getId())
                .userId(session.getUser() != null ? session.getUser().getId() : null)
                .mode(session.getMode())
                .status(session.getStatus())
                .totalPenaltyPoints(session.getTotalPenaltyPoints())
                .isPassed(session.getIsPassed())
                .timeSpentSeconds(session.getTimeSpentSeconds())
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .vehicleModel(session.getVehicleModel())
                .exerciseResults(results)
                .penaltyEvents(penalties)
                .build();
    }
}
