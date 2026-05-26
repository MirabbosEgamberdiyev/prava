package uz.pravaimtihon.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.request.LearningCenterRequest;
import uz.pravaimtihon.dto.response.LearningCenterResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.LearningCenter;
import uz.pravaimtihon.entity.LearningCenterStatus;
import uz.pravaimtihon.repository.LearningCenterRepository;
import uz.pravaimtihon.service.LearningCenterService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LearningCenterServiceImpl implements LearningCenterService {

    private final LearningCenterRepository repo;

    // ── Create ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public LearningCenterResponse create(LearningCenterRequest req, String operator) {
        LearningCenter lc = LearningCenter.builder()
                .name(req.getName().trim())
                .address(trimOrNull(req.getAddress()))
                .phone(trimOrNull(req.getPhone()))
                .contactPerson(trimOrNull(req.getContactPerson()))
                .email(trimOrNull(req.getEmail()))
                .notes(trimOrNull(req.getNotes()))
                .status(LearningCenterStatus.ACTIVE)
                .build();

        lc = repo.save(lc);
        log.info("Learning center created by '{}': id={}, name='{}'", operator, lc.getId(), lc.getName());
        return toResponse(lc);
    }

    // ── Update ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public LearningCenterResponse update(Long id, LearningCenterRequest req, String operator) {
        LearningCenter lc = findById(id);
        lc.setName(req.getName().trim());
        lc.setAddress(trimOrNull(req.getAddress()));
        lc.setPhone(trimOrNull(req.getPhone()));
        lc.setContactPerson(trimOrNull(req.getContactPerson()));
        lc.setEmail(trimOrNull(req.getEmail()));
        lc.setNotes(trimOrNull(req.getNotes()));
        lc = repo.save(lc);
        log.info("Learning center id={} updated by '{}'", id, operator);
        return toResponse(lc);
    }

    // ── List ──────────────────────────────────────────────────────────────

    @Override
    public PageResponse<LearningCenterResponse> list(
            String search, LearningCenterStatus status,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = buildSort(sortBy, sortDir);
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);
        Page<LearningCenter> pg = repo.findFiltered(blankToNull(search), status, pageable);

        List<LearningCenterResponse> content = pg.getContent()
                .stream()
                .map(this::toResponseWithStats)
                .toList();

        return PageResponse.<LearningCenterResponse>builder()
                .content(content)
                .page(pg.getNumber())
                .size(pg.getSize())
                .totalElements(pg.getTotalElements())
                .totalPages(pg.getTotalPages())
                .first(pg.isFirst())
                .last(pg.isLast())
                .empty(pg.isEmpty())
                .build();
    }

    // ── Get by ID ─────────────────────────────────────────────────────────

    @Override
    public LearningCenterResponse getById(Long id) {
        return toResponseWithStats(findById(id));
    }

    // ── List Active (dropdown) ────────────────────────────────────────────

    @Override
    public List<LearningCenterResponse> listActive() {
        return repo.findAllActiveOrderByName()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Set status ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public LearningCenterResponse setStatus(Long id, LearningCenterStatus status, String operator) {
        LearningCenter lc = findById(id);
        lc.setStatus(status);
        lc = repo.save(lc);
        log.info("Learning center id={} status set to {} by '{}'", id, status, operator);
        return toResponseWithStats(lc);
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Long id, String operator) {
        LearningCenter lc = findById(id);
        if (lc.getStatus() == LearningCenterStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Cannot delete an ACTIVE learning center. Set it to INACTIVE first.");
        }
        long activeCodes = repo.countActiveCodes(id);
        if (activeCodes > 0) {
            throw new IllegalStateException(
                    "Cannot delete a learning center that has " + activeCodes + " active activation code(s).");
        }
        lc.softDelete(operator);
        repo.save(lc);
        log.info("Learning center id={} soft-deleted by '{}'", id, operator);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private LearningCenter findById(Long id) {
        return repo.findById(id)
                .filter(lc -> !Boolean.TRUE.equals(lc.getDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Learning center not found: " + id));
    }

    /** Lightweight response — no stats aggregates (used for dropdown). */
    private LearningCenterResponse toResponse(LearningCenter lc) {
        return LearningCenterResponse.builder()
                .id(lc.getId())
                .name(lc.getName())
                .address(lc.getAddress())
                .phone(lc.getPhone())
                .contactPerson(lc.getContactPerson())
                .email(lc.getEmail())
                .notes(lc.getNotes())
                .status(lc.getStatus())
                .createdAt(lc.getCreatedAt())
                .updatedAt(lc.getUpdatedAt())
                .createdBy(lc.getCreatedBy())
                .build();
    }

    /** Full response with code-count stats (used for list/detail). */
    private LearningCenterResponse toResponseWithStats(LearningCenter lc) {
        Long lcId = lc.getId();
        return LearningCenterResponse.builder()
                .id(lcId)
                .name(lc.getName())
                .address(lc.getAddress())
                .phone(lc.getPhone())
                .contactPerson(lc.getContactPerson())
                .email(lc.getEmail())
                .notes(lc.getNotes())
                .status(lc.getStatus())
                .totalCodes(repo.countTotalCodes(lcId))
                .activeCodes(repo.countActiveCodes(lcId))
                .computerCount(repo.countComputers(lcId))
                .createdAt(lc.getCreatedAt())
                .updatedAt(lc.getUpdatedAt())
                .createdBy(lc.getCreatedBy())
                .build();
    }

    private static Sort buildSort(String sortBy, String sortDir) {
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String field = switch (sortBy == null ? "" : sortBy) {
            case "name"      -> "name";
            case "status"    -> "status";
            default          -> "createdAt";
        };
        return Sort.by(dir, field);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static String trimOrNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
