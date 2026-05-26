package uz.pravaimtihon.service;

import uz.pravaimtihon.dto.request.LearningCenterRequest;
import uz.pravaimtihon.dto.response.LearningCenterResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.LearningCenterStatus;

import java.util.List;

/**
 * Contract for the learning-center management domain.
 */
public interface LearningCenterService {

    /**
     * Create a new learning center.
     */
    LearningCenterResponse create(LearningCenterRequest request, String operator);

    /**
     * Update an existing learning center.
     */
    LearningCenterResponse update(Long id, LearningCenterRequest request, String operator);

    /**
     * Paginated, filtered list.
     *
     * @param search free-text (name / address / phone / contact / email)
     * @param status optional status filter; null = all
     * @param page   zero-based page index
     * @param size   page size (capped at 100)
     * @param sortBy field name: "name" | "createdAt" | "status"
     * @param sortDir "asc" | "desc"
     */
    PageResponse<LearningCenterResponse> list(
            String search,
            LearningCenterStatus status,
            int page, int size,
            String sortBy, String sortDir
    );

    /**
     * Retrieve a single learning center by DB id.
     */
    LearningCenterResponse getById(Long id);

    /**
     * Flat list of all ACTIVE learning centers — used for dropdowns.
     */
    List<LearningCenterResponse> listActive();

    /**
     * Change the status of a learning center (ACTIVE ↔ INACTIVE).
     */
    LearningCenterResponse setStatus(Long id, LearningCenterStatus status, String operator);

    /**
     * Soft-delete a learning center.
     * Only INACTIVE centers with no active codes may be deleted.
     */
    void delete(Long id, String operator);
}
