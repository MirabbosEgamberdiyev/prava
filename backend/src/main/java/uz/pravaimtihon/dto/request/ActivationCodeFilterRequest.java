package uz.pravaimtihon.dto.request;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import uz.pravaimtihon.entity.ActivationCodeStatus;

import java.time.LocalDate;

/**
 * Aktivatsiya kodlari ro'yxati uchun filter parametrlari.
 * Barcha maydonlar ixtiyoriy.
 */
@Data
public class ActivationCodeFilterRequest {

    /**
     * Erkin matn qidiruvi: machineId, kompyuter nomi, o'quv markazi nomi,
     * MAC manzili.
     */
    private String search;

    /** Bitta kompyuter bo'yicha filter. */
    private Long computerId;

    /** O'quv markazi bo'yicha filter (barcha kompyuterlari). */
    private Long learningCenterId;

    /** Saqlangan status filteri. null = barchasi. */
    private ActivationCodeStatus status;

    /**
     * Display group filteri:
     * ACTIVE | EXPIRING | EXPIRED | DEACTIVATED
     */
    private String group;

    /** Kim yaratgan. */
    private String generatedBy;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateTo;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDateTo;

    private int    page    = 0;
    private int    size    = 20;
    private String sortBy  = "createdAt";
    private String sortDir = "desc";
}
