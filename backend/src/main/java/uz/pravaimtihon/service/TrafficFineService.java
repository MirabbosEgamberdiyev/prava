package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.request.BhmRateRequest;
import uz.pravaimtihon.dto.request.TrafficFineRequest;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.entity.BhmRate;
import uz.pravaimtihon.entity.TrafficFine;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.BhmRateRepository;
import uz.pravaimtihon.repository.TrafficFineRepository;
import uz.pravaimtihon.util.ETags;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * B-08: yo'l harakati jarimalari (BHM koeffitsientlari) va BHM miqdori — klientlar uchun yagona manba.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrafficFineService {

    /** bhm_rates bo'sh bo'lsa (migratsiya ishlamagan muhit) — klientlardagi DEFAULT_BHM bilan bir xil. */
    public static final BigDecimal FALLBACK_BHM = new BigDecimal("375000");

    private final TrafficFineRepository fineRepository;
    private final BhmRateRepository bhmRateRepository;

    // ── DTO'lar ────────────────────────────────────────────────────────────────

    public record Bhm(BigDecimal amount, LocalDate effectiveFrom) {}

    /**
     * @param bhmMin    minimal jarima, BHM koeffitsienti
     * @param bhmMax    maksimal jarima, BHM koeffitsienti (oraliq bo'lmasa null)
     * @param amountMin qulaylik uchun: bhmMin × joriy BHM, so'mda (butun songa yaxlitlangan)
     * @param amountMax qulaylik uchun: bhmMax × joriy BHM (bhmMax null bo'lsa null)
     */
    public record FineItem(Long id, String articleCode, LocalizedText title,
                           BigDecimal bhmMin, BigDecimal bhmMax,
                           Long amountMin, Long amountMax,
                           LocalizedText extraSanction, Integer sortOrder) {}

    public record FinesPayload(Bhm bhm, String version, List<FineItem> fines) {}

    public record AdminFine(Long id, String articleCode,
                            String titleUzl, String titleUzc, String titleRu,
                            BigDecimal bhmMin, BigDecimal bhmMax,
                            String extraSanctionUzl, String extraSanctionUzc, String extraSanctionRu,
                            Integer sortOrder, Boolean active, Instant updatedAt) {}

    public record AdminBhm(Long id, BigDecimal amount, LocalDate effectiveFrom, Instant createdAt) {}

    // ── Public ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FinesPayload publicFines() {
        Bhm bhm = currentBhm();
        List<FineItem> items = fineRepository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .map(f -> toItem(f, bhm.amount()))
                .toList();
        return new FinesPayload(bhm, versionOf(bhm, items), items);
    }

    @Transactional(readOnly = true)
    public Bhm currentBhm() {
        return bhmRateRepository.findFirstByEffectiveFromLessThanEqualOrderByEffectiveFromDescIdDesc(LocalDate.now())
                .map(r -> new Bhm(r.getAmount(), r.getEffectiveFrom()))
                .orElseGet(() -> new Bhm(FALLBACK_BHM, null));
    }

    // ── Admin: jarimalar ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminFine> listAll() {
        return fineRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(TrafficFineService::toAdmin).toList();
    }

    @Transactional
    public AdminFine create(TrafficFineRequest request) {
        TrafficFine fine = new TrafficFine();
        apply(fine, request);
        return toAdmin(fineRepository.save(fine));
    }

    @Transactional
    public AdminFine update(Long id, TrafficFineRequest request) {
        TrafficFine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("error.fine.not.found"));
        apply(fine, request);
        return toAdmin(fineRepository.save(fine));
    }

    @Transactional
    public void delete(Long id) {
        TrafficFine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("error.fine.not.found"));
        fineRepository.delete(fine);
        log.info("Traffic fine deleted: id={}, article={}", id, fine.getArticleCode());
    }

    // ── Admin: BHM ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminBhm> bhmHistory() {
        return bhmRateRepository.findAllByOrderByEffectiveFromDescIdDesc().stream()
                .map(r -> new AdminBhm(r.getId(), r.getAmount(), r.getEffectiveFrom(), r.getCreatedAt()))
                .toList();
    }

    @Transactional
    public AdminBhm setBhm(BhmRateRequest request) {
        BhmRate saved = bhmRateRepository.save(BhmRate.builder()
                .amount(request.getAmount())
                .effectiveFrom(request.getEffectiveFrom())
                .build());
        log.info("BHM rate set: amount={}, effectiveFrom={}", saved.getAmount(), saved.getEffectiveFrom());
        return new AdminBhm(saved.getId(), saved.getAmount(), saved.getEffectiveFrom(), saved.getCreatedAt());
    }

    // ── Yordamchilar ─────────────────────────────────────────────────────────────

    private static void apply(TrafficFine fine, TrafficFineRequest r) {
        if (r.getBhmMax() != null && r.getBhmMax().compareTo(r.getBhmMin()) < 0) {
            throw new BusinessException("error.fine.bhm.range");
        }
        fine.setArticleCode(r.getArticleCode().trim());
        fine.setTitleUzl(r.getTitleUzl());
        fine.setTitleUzc(r.getTitleUzc());
        fine.setTitleRu(r.getTitleRu());
        fine.setBhmMin(r.getBhmMin());
        fine.setBhmMax(r.getBhmMax());
        fine.setExtraSanctionUzl(r.getExtraSanctionUzl());
        fine.setExtraSanctionUzc(r.getExtraSanctionUzc());
        fine.setExtraSanctionRu(r.getExtraSanctionRu());
        fine.setSortOrder(r.getSortOrder() != null ? r.getSortOrder() : 0);
        fine.setActive(r.getActive() == null || r.getActive());
    }

    private static FineItem toItem(TrafficFine f, BigDecimal bhm) {
        boolean hasSanction = notBlank(f.getExtraSanctionUzl()) || notBlank(f.getExtraSanctionUzc())
                || notBlank(f.getExtraSanctionRu());
        return new FineItem(
                f.getId(),
                f.getArticleCode(),
                LocalizedText.of(f.getTitleUzl(), f.getTitleUzc(), null, f.getTitleRu()),
                f.getBhmMin(),
                f.getBhmMax(),
                amount(f.getBhmMin(), bhm),
                amount(f.getBhmMax(), bhm),
                hasSanction ? LocalizedText.of(f.getExtraSanctionUzl(), f.getExtraSanctionUzc(), null, f.getExtraSanctionRu()) : null,
                f.getSortOrder());
    }

    static Long amount(BigDecimal multiplier, BigDecimal bhm) {
        if (multiplier == null || bhm == null) {
            return null;
        }
        return multiplier.multiply(bhm).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private static AdminFine toAdmin(TrafficFine f) {
        return new AdminFine(f.getId(), f.getArticleCode(), f.getTitleUzl(), f.getTitleUzc(), f.getTitleRu(),
                f.getBhmMin(), f.getBhmMax(), f.getExtraSanctionUzl(), f.getExtraSanctionUzc(), f.getExtraSanctionRu(),
                f.getSortOrder(), f.getActive(), f.getUpdatedAt());
    }

    /** Kontent versiyasi: BHM + barcha faol jarimalar maydonlari (o'zgarsa versiya/ETag o'zgaradi). */
    private static String versionOf(Bhm bhm, List<FineItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append(plain(bhm.amount())).append('|').append(bhm.effectiveFrom());
        for (FineItem i : items) {
            sb.append('\n').append(i.id()).append('|').append(i.articleCode()).append('|')
                    .append(i.title()).append('|').append(plain(i.bhmMin())).append('|').append(plain(i.bhmMax()))
                    .append('|').append(i.extraSanction()).append('|').append(i.sortOrder());
        }
        String etag = ETags.strongOf(sb.toString());
        return etag.substring(1, etag.length() - 1);
    }

    private static String plain(BigDecimal v) {
        return v == null ? "" : v.stripTrailingZeros().toPlainString();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
