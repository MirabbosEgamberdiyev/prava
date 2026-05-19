package uz.pravaimtihon.backup.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Import paytida qaysi jadvallar guruhlarini va media fayllarni import qilishni boshqaradi.
 * Default: hammasi import qilinadi (all = true).
 *
 * Guruhlar va ular qamrab olgan jadvallar:
 *   importUsers             → users
 *   importTopics            → topics
 *   importQuestions         → questions, question_options, package_questions, ticket_questions
 *   importExamPackages      → exam_packages, tickets
 *   importExamSessions      → exam_sessions, exam_answers
 *   importUserStatistics    → user_statistics
 *   importPayments          → payments
 *   importTokens            → refresh_tokens, verification_codes
 *   importUserPackageAccess → user_package_access
 *   importMedia             → mahalliy media fayllar
 */
@Data
@NoArgsConstructor
public class ImportOptions {

    private boolean importUsers             = true;
    private boolean importTopics            = true;
    /** questions, question_options, package_questions, ticket_questions */
    private boolean importQuestions         = true;
    /** exam_packages, tickets */
    private boolean importExamPackages      = true;
    /** exam_sessions, exam_answers */
    private boolean importExamSessions      = true;
    private boolean importUserStatistics    = true;
    private boolean importPayments          = true;
    /** refresh_tokens, verification_codes */
    private boolean importTokens            = true;
    private boolean importUserPackageAccess = true;
    private boolean importMedia             = true;

    /** Ushbu jadval import qilinishini tekshiradi. */
    public boolean isTableEnabled(String tableName) {
        return switch (tableName) {
            case "users"                                              -> importUsers;
            case "topics"                                             -> importTopics;
            case "questions", "question_options",
                 "package_questions", "ticket_questions"             -> importQuestions;
            case "exam_packages", "tickets"                          -> importExamPackages;
            case "exam_sessions", "exam_answers"                     -> importExamSessions;
            case "user_statistics"                                    -> importUserStatistics;
            case "payments"                                           -> importPayments;
            case "refresh_tokens", "verification_codes"              -> importTokens;
            case "user_package_access"                               -> importUserPackageAccess;
            default                                                   -> true;
        };
    }

    /** Barcha jadvallarni import qilish uchun default options. */
    public static ImportOptions all() {
        return new ImportOptions();
    }
}
