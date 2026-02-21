package uz.pravaimtihon.dto.response.exam;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Javob tafsilotlari - natijada ko'rsatiladi.
 * To'g'ri javob va tushuntirish 4 tilda.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnswerDetailResponse {

    private Long questionId;
    private Integer questionOrder;
    private LocalizedText questionText;
    private String imageUrl;
    private List<OptionResponse> options;

    /**
     * Foydalanuvchi tanlagan variant indeksi (null = javob berilmagan)
     */
    private Integer selectedOptionIndex;

    /**
     * To'g'ri variant indeksi
     */
    private Integer correctOptionIndex;

    /**
     * Javob to'g'ri yoki yo'q
     */
    private Boolean isCorrect;

    /**
     * Tushuntirish - 4 tilda
     */
    private LocalizedText explanation;

    /**
     * Savolga sarflangan vaqt (soniya)
     */
    private Long timeSpentSeconds;
}
