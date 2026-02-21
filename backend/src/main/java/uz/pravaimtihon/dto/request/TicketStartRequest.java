package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bilet orqali test boshlash so'rovi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Bilet orqali test boshlash so'rovi")
public class TicketStartRequest {

    @NotNull(message = "validation.ticket.id.required")
    @Schema(description = "Bilet ID", example = "1", required = true)
    private Long ticketId;
}
