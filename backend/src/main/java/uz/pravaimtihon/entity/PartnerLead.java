package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.pravaimtihon.enums.PartnerLeadStatus;

@Entity
@Table(name = "partner_leads", indexes = {
        @Index(name = "idx_partner_lead_phone", columnList = "phone"),
        @Index(name = "idx_partner_lead_company", columnList = "company_name"),
        @Index(name = "idx_partner_lead_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerLead extends BaseEntity {

    @Column(name = "company_name", nullable = false, length = 250)
    private String companyName;

    @Column(name = "contact_person", nullable = false, length = 200)
    private String contactPerson;

    @Column(name = "phone", nullable = false, length = 50)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "computer_count", length = 50)
    private String computerCount;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PartnerLeadStatus status = PartnerLeadStatus.NEW;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "source_ip", length = 100)
    private String sourceIp;
}
