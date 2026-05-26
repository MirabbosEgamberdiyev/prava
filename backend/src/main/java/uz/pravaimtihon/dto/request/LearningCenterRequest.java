package uz.pravaimtihon.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** O'quv markazi yaratish / tahrirlash so'rovi. */
@Data
public class LearningCenterRequest {

    @NotBlank(message = "O'quv markazi nomi majburiy")
    @Size(max = 200, message = "Nom 200 ta belgidan oshmasin")
    private String name;

    @Size(max = 300, message = "Manzil 300 ta belgidan oshmasin")
    private String address;

    @Pattern(
        regexp = "^$|^[+]?[0-9\\s\\-()]{7,20}$",
        message = "Telefon raqami noto'g'ri formatda"
    )
    @Size(max = 20)
    private String phone;

    @Size(max = 200, message = "Mas'ul shaxs ismi 200 ta belgidan oshmasin")
    private String contactPerson;

    @Email(message = "Email noto'g'ri formatda")
    @Size(max = 100)
    private String email;

    @Size(max = 500, message = "Izoh 500 ta belgidan oshmasin")
    private String notes;
}
