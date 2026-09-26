package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.response.ApiResponse;

import java.util.concurrent.TimeUnit;

/**
 * Imtihon qoidalarining yagona manbasi (web, desktop, mobil).
 *
 * <p>Avval qoidalar har bir klientda alohida yozilgan edi va farq qilardi (masalan marafon:
 * mobil 1 daqiqa/savol, web/desktop 20 savolga 30 daqiqa). Klientlar bu qiymatlarni
 * keshlaydi va offline'da o'z default'lari (xuddi shu qiymatlar) bilan ishlaydi.
 */
@RestController
@RequestMapping("/api/v1/public")
@Tag(name = "Exam rules", description = "Imtihon qoidalari (public)")
public class PublicExamRulesController {

    private final ExamRules rules;

    public PublicExamRulesController(ExamRules rules) {
        this.rules = rules;
    }

    @GetMapping("/exam-rules")
    @Operation(summary = "Imtihon qoidalari: savollar soni, vaqt, xatolar chegarasi")
    public ResponseEntity<ApiResponse<ExamRules>> getExamRules() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(ApiResponse.success(rules));
    }

    @Data
    @Component
    @ConfigurationProperties(prefix = "app.exam.rules")
    public static class ExamRules {
        /** Klientlar keshini yangilash uchun — qoidalar o'zgarsa oshiring. */
        private int version = 1;
        private Real real = new Real();
        private Ticket ticket = new Ticket();
        private Marathon marathon = new Marathon();

        @Data
        public static class Real {
            private int questionCount = 20;
            private int secondsPerQuestion = 60;
            private int maxWrong = 2;
            private boolean unansweredCountsAsWrong = true;
        }

        @Data
        public static class Ticket {
            private int secondsPerQuestion = 60;
            private int passPercent = 90;
        }

        @Data
        public static class Marathon {
            private int secondsPerQuestion = 60;
            private int passPercent = 90;
        }
    }
}
