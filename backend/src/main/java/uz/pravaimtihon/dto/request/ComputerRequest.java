package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** Kompyuter yaratish / tahrirlash so'rovi. */
@Data
public class ComputerRequest {

    @NotBlank(message = "Kompyuter nomi majburiy")
    @Size(max = 200, message = "Nom 200 ta belgidan oshmasin")
    private String name;

    /**
     * Desktop ilova ko'rsatadigan apparat identifikatori.
     * Ed25519 token shu asosida imzolanadi.
     */
    @NotBlank(message = "Machine ID majburiy")
    @Size(min = 4, max = 255, message = "Machine ID 4–255 ta belgi bo'lishi kerak")
    private String machineId;

    /** MAC manzili (ixtiyoriy). */
    @Size(max = 50, message = "MAC manzili 50 ta belgidan oshmasin")
    private String macAddress;

    /** Qo'shimcha qurilma identifikatori (ixtiyoriy). */
    @Size(max = 255, message = "Device ID 255 ta belgidan oshmasin")
    private String deviceId;

    /** Qaysi o'quv markaziga tegishli (majburiy). */
    @NotNull(message = "O'quv markazi tanlanishi shart")
    private Long learningCenterId;

    @Size(max = 500, message = "Izoh 500 ta belgidan oshmasin")
    private String notes;
}
