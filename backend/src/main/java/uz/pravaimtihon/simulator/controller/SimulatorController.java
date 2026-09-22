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
@RequestMapping("/api/v1/simulator")
@RequiredArgsConstructor
@Tag(name = "Autodrome 3D Simulator", description = "Professional driving simulation API for sessions, real-time evaluation, and statistics")
public class SimulatorController {

    private final SimulatorService simulatorService;

    @PostMapping("/sessions")
    @Operation(summary = "Start simulator session", description = "Starts a new simulation session (Training, Practice, or Exam)")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> startSession(
            @Valid @RequestBody StartSimulatorSessionRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            // Fallback for guest trial simulation if unauthenticated
            userId = 1L;
        }
        SimulatorSessionResponse response = simulatorService.createSession(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get simulator session", description = "Retrieves simulation session details and result")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> getSession(
            @PathVariable Long id) {
        SimulatorSessionResponse response = simulatorService.getSession(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/sessions/{id}/events")
    @Operation(summary = "Record penalty or sensor event", description = "Records a collision, line-crossing, or rule violation during simulation")
    public ResponseEntity<ApiResponse<Void>> recordPenalty(
            @PathVariable Long id,
            @Valid @RequestBody RecordSimulatorPenaltyRequest request) {
        simulatorService.recordPenalty(id, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/sessions/{id}/finish")
    @Operation(summary = "Finish simulator session", description = "Finalizes the simulation session with results and computes pass/fail status")
    public ResponseEntity<ApiResponse<SimulatorSessionResponse>> finishSession(
            @PathVariable Long id,
            @Valid @RequestBody FinishSimulatorSessionRequest request) {
        SimulatorSessionResponse response = simulatorService.finishSession(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/statistics")
    @Operation(summary = "User simulator statistics", description = "Returns aggregated statistics, pass rate, average score and time")
    public ResponseEntity<ApiResponse<SimulatorStatisticsDto>> getUserStatistics() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            userId = 1L;
        }
        SimulatorStatisticsDto stats = simulatorService.getUserStatistics(userId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/weak-exercises")
    @Operation(summary = "User weak exercises", description = "Identifies exercises with highest failure count for targeted practice")
    public ResponseEntity<ApiResponse<List<WeakExerciseDto>>> getWeakExercises() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            userId = 1L;
        }
        List<WeakExerciseDto> list = simulatorService.getWeakExercises(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/exercises")
    @Operation(summary = "Get simulator exercises", description = "List of 12 official autodrome exercises with configurations")
    public ResponseEntity<ApiResponse<List<SimulatorExerciseConfig>>> getExercises() {
        List<SimulatorExerciseConfig> exercises = simulatorService.getActiveExercises();
        return ResponseEntity.ok(ApiResponse.success(exercises));
    }

    @GetMapping("/vehicles")
    @Operation(summary = "Get vehicle configurations", description = "List of supported 3D vehicles and physics specifications")
    public ResponseEntity<ApiResponse<List<SimulatorVehicleConfig>>> getVehicles() {
        List<SimulatorVehicleConfig> vehicles = simulatorService.getVehicleConfigs();
        return ResponseEntity.ok(ApiResponse.success(vehicles));
    }
}
