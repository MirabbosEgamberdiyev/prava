package uz.pravaimtihon.dto.request;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import uz.pravaimtihon.entity.ActivationCodeStatus;

import java.time.LocalDate;

/**
 * Query parameters for the activation-code list endpoint.
 * All fields are optional — omitting a field means "no filter on that dimension".
 */
@Data
public class ActivationCodeFilterRequest {

    /**
     * Full-text search across: machineId, clientFirstName, clientLastName,
     * clientPhone, learningCenter.
     */
    private String search;

    /**
     * Persisted status filter.  If null → return all statuses.
     * "EXPIRING" is a virtual group — use {@code group} instead.
     */
    private ActivationCodeStatus status;

    /**
     * Display group filter (maps to the badge colour in the UI):
     * <ul>
     *   <li>ACTIVE      — status=ACTIVE and endDate >= today+3</li>
     *   <li>EXPIRING    — status=ACTIVE and endDate in [today, today+3)</li>
     *   <li>EXPIRED     — status=EXPIRED or (status=ACTIVE and endDate < today)</li>
     *   <li>DEACTIVATED — status=DEACTIVATED</li>
     * </ul>
     */
    private String group;   // "ACTIVE" | "EXPIRING" | "EXPIRED" | "DEACTIVATED"

    /** Filter by who generated the code. */
    private String generatedBy;

    /** Inclusive lower bound of startDate. */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateFrom;

    /** Inclusive upper bound of startDate. */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDateTo;

    /** Inclusive lower bound of endDate. */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDateFrom;

    /** Inclusive upper bound of endDate. */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDateTo;

    private int page = 0;
    private int size = 20;

    /** Sort field: "createdAt" | "endDate" | "clientLastName" | "status" */
    private String sortBy = "createdAt";

    /** Sort direction: "asc" | "desc" */
    private String sortDir = "desc";
}
