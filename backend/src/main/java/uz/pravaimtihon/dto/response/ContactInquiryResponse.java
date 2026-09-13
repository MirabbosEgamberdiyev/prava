package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.pravaimtihon.enums.InquiryDeliveryStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactInquiryResponse {
    private String ticketId;
    private String message;
    private boolean delivered;
    private boolean telegramSent;
    private boolean emailSent;
    private InquiryDeliveryStatus deliveryStatus;
    private LocalDateTime createdAt;
}
