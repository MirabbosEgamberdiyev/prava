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
import uz.pravaimtihon.dto.request.ComputerRequest;
import uz.pravaimtihon.dto.response.ComputerResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.Computer;
import uz.pravaimtihon.entity.ComputerStatus;
import uz.pravaimtihon.entity.LearningCenter;
import uz.pravaimtihon.repository.ComputerRepository;
import uz.pravaimtihon.repository.LearningCenterRepository;
import uz.pravaimtihon.service.ComputerService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ComputerServiceImpl implements ComputerService {

    private final ComputerRepository    repo;
    private final LearningCenterRepository lcRepo;

    // ── Create ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ComputerResponse create(ComputerRequest req, String operator) {
        LearningCenter lc = findLc(req.getLearningCenterId());

        // machineId noyob bo'lishi shart
        if (repo.existsByMachineIdAndDeletedFalse(req.getMachineId().toLowerCase().trim())) {
            throw new IllegalArgumentException(
                    "Bu machineId allaqachon ro'yxatda bor: " + req.getMachineId());
        }

        Computer c = Computer.builder()
                .name(req.getName().trim())
                .machineId(req.getMachineId().toLowerCase().trim())
                .macAddress(trimOrNull(req.getMacAddress()))
                .deviceId(trimOrNull(req.getDeviceId()))
                .learningCenter(lc)
                .status(ComputerStatus.ACTIVE)
                .notes(trimOrNull(req.getNotes()))
                .build();

        c = repo.save(c);
        log.info("Computer '{}' created by '{}' in LC '{}'", c.getName(), operator, lc.getName());
        return toResponseWithStats(c);
    }

    // ── Update ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ComputerResponse update(Long id, ComputerRequest req, String operator) {
        Computer c = findById(id);
        LearningCenter lc = findLc(req.getLearningCenterId());

        String newMachineId = req.getMachineId().toLowerCase().trim();
        if (!c.getMachineId().equals(newMachineId)
                && repo.existsByMachineIdAndIdNotAndDeletedFalse(newMachineId, id)) {
            throw new IllegalArgumentException(
                    "Bu machineId allaqachon ro'yxatda bor: " + req.getMachineId());
        }

        c.setName(req.getName().trim());
        c.setMachineId(newMachineId);
        c.setMacAddress(trimOrNull(req.getMacAddress()));
        c.setDeviceId(trimOrNull(req.getDeviceId()));
        c.setLearningCenter(lc);
        c.setNotes(trimOrNull(req.getNotes()));

        c = repo.save(c);
        log.info("Computer id={} updated by '{}'", id, operator);
        return toResponseWithStats(c);
    }

    // ── List ──────────────────────────────────────────────────────────────

    @Override
    public PageResponse<ComputerResponse> list(
            Long lcId, String search, ComputerStatus status,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = buildSort(sortBy, sortDir);
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), sort);
        Page<Computer> pg = repo.findFiltered(lcId, blankToNull(search), status, pageable);

        List<ComputerResponse> content = pg.getContent()
                .stream()
                .map(this::toResponseWithStats)
                .toList();

        return PageResponse.<ComputerResponse>builder()
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
    public ComputerResponse getById(Long id) {
        return toResponseWithStats(findById(id));
    }

    // ── Active list ───────────────────────────────────────────────────────

    @Override
    public List<ComputerResponse> listActiveByLearningCenter(Long lcId) {
        return repo.findActiveByLearningCenter(lcId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ComputerResponse> listAllActive() {
        return repo.findAllActive()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Set status ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ComputerResponse setStatus(Long id, ComputerStatus status, String operator) {
        Computer c = findById(id);
        c.setStatus(status);
        c = repo.save(c);
        log.info("Computer id={} status → {} by '{}'", id, status, operator);
        return toResponseWithStats(c);
    }

    // ── Delete ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Long id, String operator) {
        Computer c = findById(id);
        if (c.getStatus() == ComputerStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Faol kompyuterni o'chirib bo'lmaydi. Avval INACTIVE qiling.");
        }
        long activeCodes = repo.countActiveCodes(id);
        if (activeCodes > 0) {
            throw new IllegalStateException(
                    "Bu kompyuterda " + activeCodes + " ta faol aktivatsiya kodi bor.");
        }
        c.softDelete(operator);
        repo.save(c);
        log.info("Computer id={} soft-deleted by '{}'", id, operator);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private Computer findById(Long id) {
        return repo.findById(id)
                .filter(c -> !Boolean.TRUE.equals(c.getDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Kompyuter topilmadi: " + id));
    }

    private LearningCenter findLc(Long lcId) {
        return lcRepo.findById(lcId)
                .filter(lc -> !Boolean.TRUE.equals(lc.getDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("O'quv markazi topilmadi: " + lcId));
    }

    /** Yengil response — statistikasiz (dropdown uchun). */
    private ComputerResponse toResponse(Computer c) {
        return ComputerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .machineId(c.getMachineId())
                .macAddress(c.getMacAddress())
                .deviceId(c.getDeviceId())
                .learningCenterId(c.getLearningCenter().getId())
                .learningCenterName(c.getLearningCenter().getName())
                .status(c.getStatus())
                .notes(c.getNotes())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .createdBy(c.getCreatedBy())
                .build();
    }

    /** To'liq response — statistika bilan (ro'yxat/detail uchun). */
    private ComputerResponse toResponseWithStats(Computer c) {
        Long cId = c.getId();
        return ComputerResponse.builder()
                .id(cId)
                .name(c.getName())
                .machineId(c.getMachineId())
                .macAddress(c.getMacAddress())
                .deviceId(c.getDeviceId())
                .learningCenterId(c.getLearningCenter().getId())
                .learningCenterName(c.getLearningCenter().getName())
                .status(c.getStatus())
                .notes(c.getNotes())
                .totalCodes(repo.countTotalCodes(cId))
                .activeCodes(repo.countActiveCodes(cId))
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .createdBy(c.getCreatedBy())
                .build();
    }

    private static Sort buildSort(String sortBy, String sortDir) {
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String field = switch (sortBy == null ? "" : sortBy) {
            case "name"   -> "name";
            case "status" -> "status";
            default       -> "createdAt";
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
