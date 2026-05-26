package uz.pravaimtihon.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Summary statistics returned alongside the paginated code list.
 * Allows the UI to render group-tab counters without a separate request.
 */
@Data
@Builder
public class ActivationCodeStatsResponse {

    private long total;
    private long active;
    private long expiring;     // active but expires within 3 days
    private long expired;
    private long deactivated;
}
