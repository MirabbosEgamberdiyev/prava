package uz.pravaimtihon.service;

import uz.pravaimtihon.dto.request.ActivationCodeFilterRequest;
import uz.pravaimtihon.dto.request.ActivationCodeRequest;
import uz.pravaimtihon.dto.response.ActivationCodeResponse;
import uz.pravaimtihon.dto.response.ActivationCodeStatsResponse;
import uz.pravaimtihon.dto.response.PageResponse;

/**
 * Contract for the activation-code management domain.
 */
public interface ActivationCodeService {

    /**
     * Generates and persists a new AES-256-GCM activation token.
     *
     * @param request  validated generation parameters
     * @param operator username of the SUPER_ADMIN performing the action
     * @return the created code response (includes formatted token)
     */
    ActivationCodeResponse generate(ActivationCodeRequest request, String operator);

    /**
     * Paginated, filtered list of activation codes.
     */
    PageResponse<ActivationCodeResponse> list(ActivationCodeFilterRequest filter);

    /**
     * Retrieve a single activation code by its database ID.
     */
    ActivationCodeResponse getById(Long id);

    /**
     * Revoke an activation code — sets status to DEACTIVATED.
     *
     * @param id       database primary key
     * @param reason   optional note explaining the revocation
     * @param operator username of the SUPER_ADMIN performing the action
     */
    ActivationCodeResponse deactivate(Long id, String reason, String operator);

    /**
     * Restore a previously deactivated (but not expired) code back to ACTIVE.
     *
     * @param id       database primary key
     * @param operator username of the SUPER_ADMIN performing the action
     */
    ActivationCodeResponse reactivate(Long id, String operator);

    /**
     * Hard-delete (soft-delete via BaseEntity) an activation code.
     * Only codes that are DEACTIVATED or EXPIRED may be deleted.
     */
    void delete(Long id, String operator);

    /**
     * Returns group counts for the dashboard tab-bar.
     */
    ActivationCodeStatsResponse getStats();

    /**
     * Scheduled task: mark all ACTIVE codes whose endDate < today as EXPIRED.
     * Called nightly by Spring's @Scheduled.
     */
    void expireOverdueCodes();
}
