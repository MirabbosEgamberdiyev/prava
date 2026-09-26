package uz.pravaimtihon.simulator.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.security.SecurityUtils;
import uz.pravaimtihon.simulator.dto.*;
import uz.pravaimtihon.simulator.entity.SimulatorExerciseConfig;
import uz.pravaimtihon.simulator.entity.SimulatorVehicleConfig;
import uz.pravaimtihon.simulator.service.SimulatorService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/autodrom")
@RequiredArgsConstructor
@Tag(name = "Autodrom 3D API", description = "Official state driving exam autodrome simulation endpoints")
public class AutodromController {

    private final SimulatorService simulatorService;

    @PostMapping("/sessions")
    @Operation(summary = "Create autodrome session", description = "Initializes a new autodrome simulation session")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> createSession(
            @Valid @RequestBody StartSimulatorSessionRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("[AutodromController] Creating session for user {} with mode {}", userId, request.getMode());
        SimulatorSessionResponse response = simulatorService.createSession(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/sessions/{id}/start")
    @Operation(summary = "Start autodrome session timer", description = "Marks session as running and returns details")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> startSession(
            @PathVariable Long id) {
        SimulatorSessionResponse response = simulatorService.getSession(SecurityUtils.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/sessions/{id}/penalties")
    @Operation(summary = "Record penalty", description = "Records a penalty event with coordinates and anti-cheat validation")
    public ResponseEntity<ApiResponse<Void>> recordPenalty(
            @PathVariable Long id,
            @Valid @RequestBody RecordSimulatorPenaltyRequest request) {
        // Anti-cheat coordinate boundary sanity check
        if (request.getPosX() != null && (request.getPosX() < 0 || request.getPosX() > 1000)) {
            log.warn("[AutodromController] Anti-cheat flag: Invalid coordinate posX={}", request.getPosX());
        }
        simulatorService.recordPenalty(SecurityUtils.getCurrentUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/sessions/{id}/finish")
    @Operation(summary = "Finish autodrome session", description = "Calculates final score, exercises status, and anti-cheat pass threshold")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> finishSession(
            @PathVariable Long id,
            @Valid @RequestBody FinishSimulatorSessionRequest request) {
        // Anti-cheat verification: exam pass threshold check
        if (request.getTotalPenaltyPoints() != null && request.getTotalPenaltyPoints() >= 100 && Boolean.TRUE.equals(request.getIsPassed())) {
            log.warn("[AutodromController] Anti-cheat correction: isPassed cannot be true with penalty points={}", request.getTotalPenaltyPoints());
            request.setIsPassed(false);
        }
        SimulatorSessionResponse response = simulatorService.finishSession(SecurityUtils.getCurrentUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/results/{id}")
    @Operation(summary = "Get autodrome result", description = "Retrieves session result, pass/fail status, and penalty log")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> getResult(
            @PathVariable Long id) {
        SimulatorSessionResponse response = simulatorService.getSession(SecurityUtils.getCurrentUserId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/exercises")
    @Operation(summary = "Get 12 autodrome exercises", description = "Retrieves configurations for all 12 autodrome exercise stations")
    public ResponseEntity<ApiResponse<List<SimulatorExerciseConfig>>> getExercises() {
        List<SimulatorExerciseConfig> exercises = simulatorService.getActiveExercises();
        return ResponseEntity.ok(ApiResponse.success(exercises));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Get user autodrome statistics", description = "Aggregated performance metrics and history")
    public ResponseEntity<ApiResponse<SimulatorStatisticsDto>> getStatistics() {
        Long userId = SecurityUtils.getCurrentUserId();
        SimulatorStatisticsDto stats = simulatorService.getUserStatistics(userId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/weak-exercises")
    @Operation(summary = "Get weak exercises", description = "Stations needing more practice")
    public ResponseEntity<ApiResponse<List<WeakExerciseDto>>> getWeakExercises() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<WeakExerciseDto> list = simulatorService.getWeakExercises(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Get vehicles", description = "List of simulated vehicle profiles")
    public ResponseEntity<ApiResponse<List<SimulatorVehicleConfig>>> getVehicles() {
        List<SimulatorVehicleConfig> vehicles = simulatorService.getVehicleConfigs();
        return ResponseEntity.ok(ApiResponse.success(vehicles));
    }
}
