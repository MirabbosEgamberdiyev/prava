package uz.pravaimtihon.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Drops NOT NULL constraints that Hibernate ddl-auto: update cannot remove.
 * Safe to run multiple times (idempotent).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SchemaUpdater {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void updateSchema() {
        try {
            log.info("Checking and updating nullable constraints...");

            // Question table
            alterColumnDropNotNull("questions", "text_uzl");
            alterColumnDropNotNull("questions", "correct_answer_index");
            alterColumnDropNotNull("questions", "difficulty");

            // QuestionOption table
            alterColumnDropNotNull("question_options", "text_uzl");
            alterColumnDropNotNull("question_options", "option_index");

            log.info("Schema nullable constraints updated successfully.");
        } catch (Exception e) {
            log.warn("Schema update skipped or failed (non-critical): {}", e.getMessage());
        }
    }

    private void alterColumnDropNotNull(String table, String column) {
        try {
            jdbcTemplate.execute(
                    String.format("ALTER TABLE %s ALTER COLUMN %s DROP NOT NULL", table, column)
            );
            log.debug("Dropped NOT NULL on {}.{}", table, column);
        } catch (Exception e) {
            // Already nullable or table doesn't exist yet - safe to ignore
            log.debug("Column {}.{} already nullable or doesn't exist: {}", table, column, e.getMessage());
        }
    }
}
