package uz.pravaimtihon.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

/**
 * Imtihon rejimi — baholash qoidasini tanlaydi (exam-rules).
 *
 * <p>Ixtiyoriy maydon: {@code null} bo'lsa eski (legacy) xatti-harakat saqlanadi —
 * rejim sessiyadan aniqlanadi (bilet → TICKET, paket → PACKAGE, aks holda MARATHON).
 */
public enum ExamMode {
    /** Davlat imtihoni formati: 20 savol, maxWrong xato (javobsiz = xato). */
    REAL,
    TICKET,
    MARATHON,
    /** Birinchi xatogacha (klient rejimi) — survival.maxWrong. */
    SURVIVAL,
    TOPIC,
    PACKAGE;

    /**
     * Yumshoq JSON parsing: katta-kichik harf farqi yo'q, noma'lum qiymat → {@code null}
     * (eski klientlar yoki yangi rejimlar so'rovni 400 bilan yiqitmasin).
     */
    @JsonCreator
    public static ExamMode fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ExamMode.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** record-offline {@code examType} ("real", "ticket", "package", "marathon", ...) → rejim. */
    public static ExamMode fromExamType(String examType) {
        if (examType == null) {
            return null;
        }
        String t = examType.trim().toLowerCase(Locale.ROOT);
        if (t.startsWith("ticket")) {
            return TICKET;
        }
        return switch (t) {
            case "real" -> REAL;
            case "package" -> PACKAGE;
            case "marathon", "marafon" -> MARATHON;
            case "survival" -> SURVIVAL;
            case "topic" -> TOPIC;
            default -> null;
        };
    }
}
