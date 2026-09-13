package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.InquiryDeliveryStatus;

@Entity
@Table(name = "contact_inquiries", indexes = {
        @Index(name = "idx_contact_inquiry_ticket", columnList = "ticket_id"),
        @Index(name = "idx_contact_inquiry_phone", columnList = "phone"),
        @Index(name = "idx_contact_inquiry_org", columnList = "organization"),
        @Index(name = "idx_contact_inquiry_status", columnList = "delivery_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactInquiry extends BaseEntity {

    @Column(name = "ticket_id", nullable = false, unique = true, length = 30)
    private String ticketId;

    @Column(name = "organization", nullable = false, length = 250)
    private String organization;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 50)
    private String phone;

    @Column(name = "telegram", length = 100)
    private String telegram;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "organization_type", length = 100)
    private String organizationType;

    @Column(name = "computer_count", length = 50)
    private String computerCount;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "client_ip", length = 100)
    private String clientIp;

    @Column(name = "telegram_delivered", nullable = false)
    @Builder.Default
    private Boolean telegramDelivered = false;

    @Column(name = "email_delivered", nullable = false)
    @Builder.Default
    private Boolean emailDelivered = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false, length = 30)
    @Builder.Default
    private InquiryDeliveryStatus deliveryStatus = InquiryDeliveryStatus.CHANNELS_FAILED;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private uz.pravaimtihon.enums.InquiryStatus status = uz.pravaimtihon.enums.InquiryStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "inquiry_type", nullable = false, length = 30)
    @Builder.Default
    private uz.pravaimtihon.enums.InquiryType inquiryType = uz.pravaimtihon.enums.InquiryType.CONTACT;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;
}
