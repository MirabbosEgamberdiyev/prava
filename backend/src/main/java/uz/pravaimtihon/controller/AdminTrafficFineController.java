package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.BhmRateRequest;
import uz.pravaimtihon.dto.request.TrafficFineRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.service.TrafficFineService;

import java.util.List;

/** B-08: jarimalar va BHM boshqaruvi (faqat ADMIN / SUPER_ADMIN). */
@RestController
@RequestMapping("/api/v1/admin/fines")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@Tag(name = "Admin fines", description = "Yo'l harakati jarimalari va BHM boshqaruvi")
public class AdminTrafficFineController {

    private final TrafficFineService fineService;

    @GetMapping
    @Operation(summary = "Barcha jarimalar (nofaollar ham)")
    public ResponseEntity<ApiResponse<List<TrafficFineService.AdminFine>>> list() {
        return ResponseEntity.ok(ApiResponse.success(fineService.listAll()));
    }

    @PostMapping
    @Operation(summary = "Jarima yaratish")
    public ResponseEntity<ApiResponse<TrafficFineService.AdminFine>> create(@Valid @RequestBody TrafficFineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(fineService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Jarimani yangilash (to'liq almashtirish)")
    public ResponseEntity<ApiResponse<TrafficFineService.AdminFine>> update(@PathVariable Long id,
                                                                          @Valid @RequestBody TrafficFineRequest request) {
        return ResponseEntity.ok(ApiResponse.success(fineService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Jarimani o'chirish (vaqtincha yashirish uchun PUT bilan active=false qiling)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        fineService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/bhm")
    @Operation(summary = "Joriy BHM va BHM tarixi")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> bhm() {
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of(
                "current", fineService.currentBhm(),
                "history", fineService.bhmHistory())));
    }

    @PostMapping("/bhm")
    @Operation(summary = "Yangi BHM miqdorini belgilash (effectiveFrom sanasidan kuchga kiradi)")
    public ResponseEntity<ApiResponse<TrafficFineService.AdminBhm>> setBhm(@Valid @RequestBody BhmRateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(fineService.setBhm(request)));
    }
}
