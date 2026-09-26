package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Desktop ilova uchun offline savollar to'plami.
 *
 * <p>Avval desktop butun bazani serverda 1200 savollik, 1200 daqiqalik HAQIQIY marafon
 * boshlab yuklab olardi — bu har sinxronizatsiyada soxta imtihon sessiyasi va statistika
 * yaratardi. Endi maxsus, versiyalangan (ETag) va xotirada keshlangan endpoint bor.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OfflineBundleService {

    private static final int CHUNK = 500;

    private final QuestionRepository questionRepository;
    private final ExamResponseMapper mapper;
    private final uz.pravaimtihon.repository.TopicRepository topicRepository;
    private final uz.pravaimtihon.repository.TicketRepository ticketRepository;
    private final uz.pravaimtihon.repository.ExamPackageRepository packageRepository;
    private final uz.pravaimtihon.payment.repository.UserPackageAccessRepository accessRepository;

    private volatile Bundle cached;

    /**
     * @param topics  v2: Android/desktop mavzular ro'yxati (savol ID'lari bilan)
     * @param tickets v2: biletlar (tartiblangan savol ID'lari bilan) — klient server ID'lari bilan ishlaydi
     */
    public record Bundle(String version, List<QuestionResponse> questions,
                         List<BundleTopic> topics, List<BundleTicket> tickets) {}

    public record BundleTopic(Long id, String code, String nameUzl, String nameUzc, String nameRu, String nameEn,
                              Integer displayOrder, List<Long> questionIds) {}

    public record BundleTicket(Long id, Integer ticketNumber, Long topicId, Long packageId,
                               String nameUzl, String nameUzc, String nameRu, String nameEn,
                               Integer durationMinutes, List<Long> questionIds) {}

    /** Joriy to'plam versiyasi — savollar soni + oxirgi o'zgarish vaqti. */
    @Transactional(readOnly = true)
    public String currentVersion() {
        // Savol, mavzu yoki bilet o'zgarsa versiya o'zgaradi (klientlar qayta yuklaydi).
        return "v2-" + part(questionRepository.activeQuestionsFingerprint())
                + "-" + part(topicRepository.activeTopicsFingerprint())
                + "-" + part(ticketRepository.activeTicketsFingerprint());
    }

    private static String part(List<Object[]> rows) {
        Object[] row = rows.isEmpty() ? new Object[]{0L, null} : rows.get(0);
        long count = row[0] == null ? 0 : ((Number) row[0]).longValue();
        long updated = row[1] instanceof LocalDateTime t ? t.toEpochSecond(ZoneOffset.UTC) : 0;
        return count + "." + updated;
    }

    @Transactional(readOnly = true)
    public Bundle getBundle() {
        String version = currentVersion();
        Bundle current = cached;
        if (current != null && current.version().equals(version)) {
            return current;
        }
        synchronized (this) {
            if (cached != null && cached.version().equals(version)) {
                return cached;
            }
            List<Long> ids = questionRepository.findAllActiveIds();
            List<QuestionResponse> questions = new ArrayList<>(ids.size());
            for (int i = 0; i < ids.size(); i += CHUNK) {
                List<Question> chunk = questionRepository.findByIdsWithOptions(ids.subList(i, Math.min(ids.size(), i + CHUNK)));
                chunk.sort((a, b) -> Long.compare(a.getId(), b.getId()));
                questions.addAll(mapper.toQuestionResponses(chunk, true));
            }
            java.util.Set<Long> activeIds = new java.util.HashSet<>(ids);

            java.util.Map<Long, List<Long>> byTopic = new java.util.HashMap<>();
            for (Object[] row : questionRepository.findActiveQuestionTopicPairs()) {
                byTopic.computeIfAbsent((Long) row[1], k -> new ArrayList<>()).add((Long) row[0]);
            }
            List<BundleTopic> topics = topicRepository.findAllActiveOrderByDisplayOrder().stream()
                    .map(t -> new BundleTopic(t.getId(), t.getCode(), t.getNameUzl(), t.getNameUzc(), t.getNameRu(),
                            t.getNameEn(), t.getDisplayOrder(), byTopic.getOrDefault(t.getId(), List.of())))
                    .toList();

            List<BundleTicket> tickets = ticketRepository.findAllActiveOrderByNumber().stream()
                    .map(t -> new BundleTicket(t.getId(), t.getTicketNumber(),
                            t.getTopic() != null ? t.getTopic().getId() : null,
                            t.getExamPackage() != null ? t.getExamPackage().getId() : null,
                            t.getNameUzl(), t.getNameUzc(), t.getNameRu(), t.getNameEn(), t.getDurationMinutes(),
                            t.getQuestions().stream().filter(java.util.Objects::nonNull)
                                    .map(Question::getId).filter(activeIds::contains).toList()))
                    .toList();

            cached = new Bundle(version, List.copyOf(questions), topics, tickets);
            log.info("Offline bundle rebuilt: version={} questions={} topics={} tickets={}",
                    version, questions.size(), topics.size(), tickets.size());
            return cached;
        }
    }

    /**
     * Foydalanuvchiga mos to'plam: pullik paketga tegishli biletlar faqat o'sha paketga
     * faol ruxsati bo'lsa beriladi (aks holda offline to'plam paywall'ni chetlab o'tardi).
     * Savol matnlari umumiy — ular bepul marafon/mavzu mashqida ham ochiq (biznes qarori).
     */
    @Transactional(readOnly = true)
    public Bundle getBundleFor(Long userId) {
        Bundle base = getBundle();
        java.util.Set<Long> locked = lockedPackageIds(userId);
        if (locked.isEmpty()) return base;
        List<BundleTicket> visible = base.tickets().stream()
                .filter(t -> t.packageId() == null || !locked.contains(t.packageId()))
                .toList();
        return new Bundle(base.version(), base.questions(), base.topics(), visible);
    }

    /** ETag foydalanuvchi huquqlarini ham hisobga oladi — to'lovdan keyin to'plam yangilanadi. */
    @Transactional(readOnly = true)
    public String currentVersionFor(Long userId) {
        java.util.List<Long> locked = new java.util.ArrayList<>(lockedPackageIds(userId));
        java.util.Collections.sort(locked);
        return currentVersion() + (locked.isEmpty() ? "" : "-L" + Integer.toHexString(locked.hashCode()));
    }

    private java.util.Set<Long> lockedPackageIds(Long userId) {
        java.util.Set<Long> locked = new java.util.HashSet<>(packageRepository.findPaidPackageIds());
        if (!locked.isEmpty() && userId != null) {
            accessRepository.findActivePackageIds(userId).forEach(locked::remove);
        }
        return locked;
    }
}
