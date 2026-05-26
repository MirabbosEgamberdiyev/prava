package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import uz.pravaimtihon.entity.LearningCenterStatus;

import java.time.LocalDateTime;

/** O'quv markazi to'liq ma'lumoti. */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LearningCenterResponse {
    private Long   id;
    private String name;
    private String address;
    private String phone;
    private String contactPerson;
    private String email;
    private String notes;
    private LearningCenterStatus status;

    /** Barcha aktivatsiya kodlari soni (o'chirilmaganlar). */
    private long totalCodes;

    /** Faol (ACTIVE yoki EXPIRING) kodlar soni. */
    private long activeCodes;

    /** Nechta alohida machineId bor (kompyuter soni). */
    private long computerCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String        createdBy;
}
