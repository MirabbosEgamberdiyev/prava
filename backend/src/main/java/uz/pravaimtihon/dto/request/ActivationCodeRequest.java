package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * O'quv markazi kompyuteri uchun aktivatsiya kodi yaratish so'rovi.
 *
 * <p>MachineId kompyuter yozuvidan avtomatik olinadi — alohida kiritish shart emas.</p>
 */
@Data
public class ActivationCodeRequest {

    /** Qaysi kompyuter uchun kod yaratilsin (majburiy). */
    @NotNull(message = "Kompyuter tanlanishi shart")
    private Long computerId;

    @NotNull(message = "Boshlanish sanasi majburiy")
    private LocalDate startDate;

    @NotNull(message = "Tugash sanasi majburiy")
    private LocalDate endDate;

    /** Ixtiyoriy admin izohi. */
    @Size(max = 500, message = "Izoh 500 ta belgidan oshmasin")
    private String notes;
}
