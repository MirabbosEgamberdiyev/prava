package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import uz.pravaimtihon.entity.ComputerStatus;

import java.time.LocalDateTime;

/** Kompyuter to'liq ma'lumoti. */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ComputerResponse {
    private Long   id;
    private String name;
    private String machineId;
    private String macAddress;
    private String deviceId;
    private Long   learningCenterId;
    private String learningCenterName;
    private ComputerStatus status;
    private String notes;

    /** Bu kompyuter uchun jami aktivatsiya kodlari soni. */
    private long totalCodes;

    /** Hozir faol (ACTIVE, muddati o'tmagan) kodlar soni. */
    private long activeCodes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String        createdBy;
}
