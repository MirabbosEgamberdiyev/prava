package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import uz.pravaimtihon.entity.ActivationCodeStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Bitta aktivatsiya kodining to'liq ma'lumoti. */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActivationCodeResponse {

    private Long id;

    // Kompyuter ma'lumotlari
    private Long   computerId;
    private String computerName;       // Computer.name
    private String macAddress;         // Computer.macAddress
    private String deviceId;           // Computer.deviceId

    // O'quv markazi (kompyuter orqali)
    private Long   learningCenterId;
    private String learningCenterName;

    // Token parametrlari
    private String    machineId;       // snapshot (generatsiya paytidagi)
    private LocalDate startDate;
    private LocalDate endDate;
    private String    licenseKey;

    // Status
    private ActivationCodeStatus status;

    /**
     * Virtual display group (badge rangi uchun):
     * "ACTIVE" | "EXPIRING" | "EXPIRED" | "DEACTIVATED"
     */
    private String displayGroup;

    /** Muddatgacha qolgan kunlar (manfiy = o'tgan). */
    private long daysUntilExpiry;

    // Admin metadata
    private String        notes;
    private String        generatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
