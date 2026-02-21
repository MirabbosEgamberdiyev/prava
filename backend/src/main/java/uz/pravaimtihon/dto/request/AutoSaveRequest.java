package uz.pravaimtihon.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Auto-save javoblar so'rovi")
public class AutoSaveRequest {

    @NotNull
    @Valid
    @Schema(description = "Javoblar ro'yxati")
    private List<AutoSaveAnswer> answers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AutoSaveAnswer {
        @NotNull
        @Schema(description = "Savol ID")
        private Long questionId;

        @Schema(description = "Tanlangan variant indeksi")
        private Integer selectedOptionIndex;

        @Schema(description = "Sarflangan vaqt (soniya)")
        private Long timeSpentSeconds;
    }
}
