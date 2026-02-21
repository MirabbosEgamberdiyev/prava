package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalDeviceLimitResponse {

    private Integer newGlobalLimit;
    private int updatedUsers;
    private long skippedCustomizedUsers;
    private String message;
}
