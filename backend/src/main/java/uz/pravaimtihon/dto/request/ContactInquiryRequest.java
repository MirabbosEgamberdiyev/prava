package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactInquiryRequest {

    @NotBlank(message = "Tashkilot nomi kiritilishi shart")
    @Size(min = 2, max = 200, message = "Tashkilot nomi 2 dan 200 belgigacha bo'lishi kerak")
    private String organization;

    @NotBlank(message = "Mas'ul shaxs ismi kiritilishi shart")
    @Size(min = 2, max = 150, message = "Mas'ul shaxs ismi 2 dan 150 belgigacha bo'lishi kerak")
    private String fullName;

    @NotBlank(message = "Telefon raqami kiritilishi shart")
    @Pattern(regexp = "^[\\d\\+\\s\\-\\(\\)]{9,30}$", message = "Telefon raqami +998 XX XXX XX XX formatida bo'lishi kerak")
    private String phone;

    private String telegram;

    private String region;

    @NotBlank(message = "Tashkilot turi tanlanishi shart")
    private String organizationType;

    private String computerCount;

    @Size(max = 2000, message = "Izoh 2000 belgidan oshmasligi kerak")
    private String comment;
}
