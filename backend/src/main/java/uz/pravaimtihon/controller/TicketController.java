package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.TicketCreateRequest;
import uz.pravaimtihon.dto.request.TicketStartRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.dto.response.exam.ExamResponse;
import uz.pravaimtihon.dto.response.exam.TicketResponse;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.TicketService;

import java.util.List;

/**
 * Bilet (Ticket) Controller - biletlar bilan ishlash.
 * Har bir biletda 10 ta savol bo'ladi.
 */
@RestController
@RequestMapping("/api/v2/tickets")
@RequiredArgsConstructor
@Tag(name = "Ticket Management", description = "Biletlar bilan ishlash - 10 ta savoldan iborat test")
public class TicketController {

    private final TicketService ticketService;
    private final MessageService messageService;

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    /**
     * Yangi bilet yaratish (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Bilet yaratish",
            description = "Yangi bilet yaratish. Aniq 10 ta savol talab qilinadi."
    )
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        TicketResponse response = ticketService.createTicket(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.ticket.created", language),
                response
        ));
    }

    /**
     * Biletni o'chirish (Admin only).
     */
    @DeleteMapping("/{ticketId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Bilet o'chirish",
            description = "Biletni soft delete qilish."
    )
    public ResponseEntity<ApiResponse<Void>> deleteTicket(
            @PathVariable Long ticketId,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ticketService.deleteTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.ticket.deleted", language),
                null
        ));
    }

    /**
     * Biletning to'liq ma'lumotlari (savollar bilan).
     */
    @GetMapping("/{ticketId}/detail")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Bilet detail",
            description = "Bilet ma'lumotlarini savollar bilan olish (Admin only)."
    )
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketDetail(@PathVariable Long ticketId) {
        TicketResponse response = ticketService.getTicketDetail(ticketId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Biletni yangilash (Admin only).
     */
    @PutMapping("/{ticketId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Bilet yangilash",
            description = "Bilet ma'lumotlarini o'zgartirish."
    )
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketCreateRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        TicketResponse response = ticketService.updateTicket(ticketId, request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.ticket.updated", language),
                response
        ));
    }

    // ============================================
    // PUBLIC ENDPOINTS
    // ============================================

    /**
     * Biletni ID bo'yicha olish.
     */
    @GetMapping("/{ticketId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Bilet olish",
            description = "Bilet ma'lumotlarini ID bo'yicha olish."
    )
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(@PathVariable Long ticketId) {
        TicketResponse response = ticketService.getTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Barcha biletlar ro'yxati (pagination bilan).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Barcha biletlar",
            description = "Barcha faol biletlar ro'yxati."
    )
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getAllTickets(
            @Parameter(description = "Sahifa raqami", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Sahifa hajmi", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Saralash maydoni", example = "ticketNumber")
            @RequestParam(defaultValue = "ticketNumber") String sortBy,

            @Parameter(description = "Saralash yo'nalishi", example = "ASC")
            @RequestParam(defaultValue = "ASC") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<TicketResponse> ticketPage = ticketService.getAllTickets(pageable);

        PageResponse<TicketResponse> response = PageResponse.<TicketResponse>builder()
                .content(ticketPage.getContent())
                .page(ticketPage.getNumber())
                .size(ticketPage.getSize())
                .totalElements(ticketPage.getTotalElements())
                .totalPages(ticketPage.getTotalPages())
                .first(ticketPage.isFirst())
                .last(ticketPage.isLast())
                .empty(ticketPage.isEmpty())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Paket bo'yicha biletlar.
     */
    @GetMapping("/package/{packageId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Paket bo'yicha biletlar",
            description = "Ma'lum paketdagi barcha biletlar."
    )
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getTicketsByPackage(
            @PathVariable Long packageId) {
        List<TicketResponse> tickets = ticketService.getTicketsByPackage(packageId);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    /**
     * Mavzu bo'yicha biletlar.
     */
    @GetMapping("/topic/{topicId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Mavzu bo'yicha biletlar",
            description = "Ma'lum mavzudagi barcha biletlar."
    )
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getTicketsByTopic(
            @PathVariable Long topicId) {
        List<TicketResponse> tickets = ticketService.getTicketsByTopic(topicId);
        return ResponseEntity.ok(ApiResponse.success(tickets));
    }

    // ============================================
    // EXAM ENDPOINTS
    // ============================================

    /**
     * Bilet orqali test boshlash (Visible mode).
     */
    @PostMapping("/start-visible")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Bilet test boshlash (Visible)",
            description = "Bilet orqali test boshlash - to'g'ri javoblar ko'rsatiladi."
    )
    public ResponseEntity<ApiResponse<ExamResponse>> startTicketVisible(
            @Valid @RequestBody TicketStartRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResponse response = ticketService.startTicketVisible(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.ticket.started", language),
                response
        ));
    }

    /**
     * Bilet orqali test boshlash (Secure mode).
     */
    @PostMapping("/start-secure")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @Operation(
            summary = "Bilet test boshlash (Secure)",
            description = "Bilet orqali test boshlash - to'g'ri javoblar YASHIRIN."
    )
    public ResponseEntity<ApiResponse<ExamResponse>> startTicketSecure(
            @Valid @RequestBody TicketStartRequest request,
            @RequestHeader(value = "Accept-Language", defaultValue = "uzl") AcceptLanguage language) {

        ExamResponse response = ticketService.startTicketSecure(request);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMessage("success.ticket.started", language),
                response
        ));
    }
}
