package uz.pravaimtihon.backup.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Ma'lumotlarni selektiv tozalash opsiyalari.
 *
 * Har bir flag tozalanishi kerak bo'lgan jadvallar guruhini belgilaydi.
 * DIQQAT: clearUsers=true yoki clearTopics=true tanlansa, unga bog'liq
 * BARCHA jadvallar ham tozalanadi (cascade dependency order).
 *
 * Guruhlar:
 *   clearExamSessions      → exam_answers, exam_sessions
 *   clearPayments          → payments
 *   clearUserPackageAccess → user_package_access
 *   clearStatistics        → user_statistics
 *   clearTokens            → verification_codes, refresh_tokens
 *   clearQuestions         → ticket_questions, package_questions, question_options, questions
 *   clearExamPackages      → ticket_questions, package_questions, tickets, exam_packages
 *   clearUsers             → user_package_access, payments, user_statistics,
 *                            refresh_tokens, verification_codes,
 *                            exam_answers, exam_sessions, users
 *   clearTopics            → ticket_questions, package_questions, question_options, questions,
 *                            tickets, exam_packages, user_statistics, topics
 *   clearMedia             → mahalliy media fayllar (uploads katalogi)
 */
@Data
@NoArgsConstructor
public class ClearOptions {

    private boolean clearUsers;
    private boolean clearTopics;
    /** questions, question_options va join jadvallar */
    private boolean clearQuestions;
    /** exam_packages va tickets */
    private boolean clearExamPackages;
    /** exam_sessions va exam_answers */
    private boolean clearExamSessions;
    private boolean clearPayments;
    private boolean clearUserPackageAccess;
    private boolean clearStatistics;
    /** refresh_tokens va verification_codes */
    private boolean clearTokens;
    /** Mahalliy media fayllar (uploads katalogi) */
    private boolean clearMedia;

    // FK-safe TRUNCATE tartibi (eng bog'liqdan boshlab)
    private static final List<String> FK_ORDER = Arrays.asList(
            "user_package_access", "payments",
            "exam_answers", "exam_sessions",
            "ticket_questions", "package_questions",
            "verification_codes", "refresh_tokens",
            "user_statistics",
            "question_options", "questions",
            "tickets", "exam_packages",
            "users", "topics"
    );

    /**
     * Tozalanishi kerak bo'lgan jadvallar ro'yxatini FK-safe tartibda qaytaradi.
     * TRUNCATE uchun ishlatiladi — foreign key constraint'larni buzmaslik uchun
     * eng bog'liq jadvallardan boshlanadi.
     */
    public List<String> getTablesToClear() {
        Set<String> tables = new LinkedHashSet<>();

        if (clearExamSessions) {
            tables.add("exam_answers");
            tables.add("exam_sessions");
        }
        if (clearPayments) {
            tables.add("payments");
        }
        if (clearUserPackageAccess) {
            tables.add("user_package_access");
        }
        if (clearStatistics) {
            tables.add("user_statistics");
        }
        if (clearTokens) {
            tables.add("verification_codes");
            tables.add("refresh_tokens");
        }
        if (clearQuestions) {
            tables.add("ticket_questions");
            tables.add("package_questions");
            tables.add("question_options");
            tables.add("questions");
        }
        if (clearExamPackages) {
            tables.add("ticket_questions");
            tables.add("package_questions");
            tables.add("tickets");
            tables.add("exam_packages");
        }
        if (clearUsers) {
            tables.add("user_package_access");
            tables.add("payments");
            tables.add("user_statistics");
            tables.add("refresh_tokens");
            tables.add("verification_codes");
            tables.add("exam_answers");
            tables.add("exam_sessions");
            tables.add("users");
        }
        if (clearTopics) {
            tables.add("ticket_questions");
            tables.add("package_questions");
            tables.add("question_options");
            tables.add("questions");
            tables.add("tickets");
            tables.add("exam_packages");
            tables.add("user_statistics");
            tables.add("topics");
        }

        // FK-safe tartibda saralash
        return FK_ORDER.stream().filter(tables::contains).collect(Collectors.toList());
    }

    /** Hech narsa tanlanmagan bo'lsa true qaytaradi. */
    public boolean isEmpty() {
        return !clearUsers && !clearTopics && !clearQuestions && !clearExamPackages
                && !clearExamSessions && !clearPayments && !clearUserPackageAccess
                && !clearStatistics && !clearTokens && !clearMedia;
    }
}
