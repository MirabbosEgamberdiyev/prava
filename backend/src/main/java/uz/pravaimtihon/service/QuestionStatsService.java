package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Savol statistikasi (times_used / times_answered_correctly) ni atomik yangilaydi.
 *
 * <p>Avval {@code question.recordAnswer()} JPA entity'ni o'zgartirardi. {@code Question} da
 * {@code @Version} bor, shuning uchun bir xil savollarni bir vaqtda topshirgan ikki
 * foydalanuvchidan biri {@code ObjectOptimisticLockingFailureException} (500) olib, butun
 * natijasi rollback bo'lardi. Endi hisoblagichlar tranzaksiya oxirida bitta
 * {@code UPDATE ... SET x = x + n} bilan oshiriladi — versiya o'zgarmaydi, qulf to'qnashuvi yo'q.
 */
@Service
@RequiredArgsConstructor
public class QuestionStatsService {

    private static final Object BUFFER_KEY = QuestionStatsService.class.getName() + ".buffer";

    private final NamedParameterJdbcTemplate jdbc;

    /** Joriy tranzaksiyada javobni qayd etadi; tranzaksiya yo'q bo'lsa darhol yoziladi. */
    public void recordAnswer(Long questionId, Boolean correct) {
        if (questionId == null) return;
        boolean isCorrect = Boolean.TRUE.equals(correct);

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            writeCounters(new HashMap<>(Map.of(questionId, new int[]{1, isCorrect ? 1 : 0})));
            return;
        }

        @SuppressWarnings("unchecked")
        Map<Long, int[]> buffer = (Map<Long, int[]>) TransactionSynchronizationManager.getResource(BUFFER_KEY);
        if (buffer == null) {
            Map<Long, int[]> newBuffer = new HashMap<>();
            TransactionSynchronizationManager.bindResource(BUFFER_KEY, newBuffer);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void beforeCommit(boolean readOnly) {
                    writeCounters(newBuffer);
                }

                @Override
                public void afterCompletion(int status) {
                    TransactionSynchronizationManager.unbindResourceIfPossible(BUFFER_KEY);
                }
            });
            buffer = newBuffer;
        }
        int[] counts = buffer.computeIfAbsent(questionId, k -> new int[2]);
        counts[0]++;
        if (isCorrect) counts[1]++;
    }

    private void writeCounters(Map<Long, int[]> buffer) {
        if (buffer.isEmpty()) return;
        // Bir xil (used, correct) juftlikdagi savollar bitta so'rovda yangilanadi — odatda 1-2 so'rov.
        Map<String, Set<Long>> groups = buffer.entrySet().stream().collect(Collectors.groupingBy(
                e -> e.getValue()[0] + ":" + e.getValue()[1],
                Collectors.mapping(Map.Entry::getKey, Collectors.toSet())));
        groups.forEach((key, ids) -> {
            String[] parts = key.split(":");
            jdbc.update("""
                    UPDATE questions
                       SET times_used = COALESCE(times_used, 0) + :used,
                           times_answered_correctly = COALESCE(times_answered_correctly, 0) + :correct
                     WHERE id IN (:ids)
                    """, new MapSqlParameterSource()
                    .addValue("used", Integer.parseInt(parts[0]))
                    .addValue("correct", Integer.parseInt(parts[1]))
                    .addValue("ids", ids));
        });
        buffer.clear();
    }
}
