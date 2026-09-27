package uz.pravaimtihon.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.repository.TicketRepository;
import uz.pravaimtihon.service.OfflineBundleService;

import java.util.concurrent.TimeUnit;

/**
 * Imtihon qoidalarining yagona manbasi (web, desktop, mobil).
 *
 * <p>Avval qoidalar har bir klientda alohida yozilgan edi va farq qilardi (masalan marafon:
 * mobil 1 daqiqa/savol, web/desktop 20 savolga 30 daqiqa). Klientlar bu qiymatlarni
 * keshlaydi va offline'da o'z default'lari (xuddi shu qiymatlar) bilan ishlaydi.
 *
 * <p>Server tomonidagi baholash ham shu qiymatlardan foydalanadi ({@code ExamGradingPolicy}).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public")
@Tag(name = "Exam rules", description = "Imtihon qoidalari (public)")
public class PublicExamRulesController {

    /** DB'dan olinadigan qiymatlar (biletlar soni, kontent versiyasi) shu muddat xotirada saqlanadi. */
    private static final long DYNAMIC_TTL_MS = 60_000;

    private final ExamRules rules;
    private final TicketRepository ticketRepository;
    private final OfflineBundleService offlineBundleService;
    private final ObjectMapper objectMapper;

    private volatile Dynamic dynamic;

    private record Dynamic(Long ticketCount, String contentVersion, long computedAt) {}

    public PublicExamRulesController(ExamRules rules, TicketRepository ticketRepository,
                                     OfflineBundleService offlineBundleService, ObjectMapper objectMapper) {
        this.rules = rules;
        this.ticketRepository = ticketRepository;
        this.offlineBundleService = offlineBundleService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/exam-rules")
    @Operation(summary = "Imtihon qoidalari: savollar soni, vaqt, xatolar chegarasi")
    public ResponseEntity<ApiResponse<ObjectNode>> getExamRules() {
        ObjectNode body = objectMapper.valueToTree(rules);
        Dynamic d = dynamicValues();
        if (d.ticketCount() != null && body.get("ticket") instanceof ObjectNode ticket) {
            ticket.put("count", d.ticketCount());
        }
        if (d.contentVersion() != null) {
            body.put("contentVersion", d.contentVersion());
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(ApiResponse.success(body));
    }

    private Dynamic dynamicValues() {
        Dynamic d = dynamic;
        long now = System.currentTimeMillis();
        if (d != null && now - d.computedAt() < DYNAMIC_TTL_MS) {
            return d;
        }
        Long count = null;
        String contentVersion = null;
        try {
            count = ticketRepository.countActiveTickets();
        } catch (Exception e) {
            log.warn("exam-rules: active ticket count unavailable: {}", e.toString());
        }
        try {
            contentVersion = offlineBundleService.currentVersion();
        } catch (Exception e) {
            log.warn("exam-rules: content version unavailable: {}", e.toString());
        }
        d = new Dynamic(count, contentVersion, now);
        dynamic = d;
        return d;
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
        private Survival survival = new Survival();
        private Guest guest = new Guest();

        @Data
        public static class Real {
            private int questionCount = 20;
            private int secondsPerQuestion = 60;
            /** Real imtihonda ruxsat etilgan xatolar (20 savolga). 4-xatoda yiqiladi. */
            private int maxWrong = 3;
            private boolean unansweredCountsAsWrong = true;
        }

        @Data
        public static class Ticket {
            private int secondsPerQuestion = 60;
            private int passPercent = 90;
            /** Bitta biletdagi savollar soni. ({@code count} — faol biletlar soni, javobda DB'dan qo'shiladi.) */
            private int questionCount = 20;
        }

        @Data
        public static class Marathon {
            private int secondsPerQuestion = 60;
            private int passPercent = 90;
            private int defaultQuestionCount = 20;
        }

        /** Birinchi xatogacha (klient rejimi). */
        @Data
        public static class Survival {
            private int maxWrong = 0;
        }

        /** Ro'yxatdan o'tmagan foydalanuvchi uchun sinov imtihoni (real imtihon formatida). */
        @Data
        public static class Guest {
            private int questionCount = 20;
            private int secondsPerQuestion = 60;
            private int maxWrong = 3;
        }
    }
}
