package uz.pravaimtihon.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import uz.pravaimtihon.controller.PublicExamRulesController.ExamRules;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.enums.ExamMode;

/**
 * Imtihonni baholashning YAGONA joyi (online submit, auto-submit, muddati o'tish, record-offline).
 *
 * <p>Barcha qiymatlar exam-rules'dan ({@code app.exam.rules.*}) olinadi:
 * <ul>
 *   <li>REAL — xato + javobsiz &le; maxWrong (20 savolga; boshqa savol soniga proporsional, pastga yaxlitlanadi);</li>
 *   <li>SURVIVAL — xato + javobsiz &le; survival.maxWrong (0);</li>
 *   <li>TICKET — ticket.passPercent (90%);</li>
 *   <li>PACKAGE — paketning admin tomonidan belgilangan o'tish bali (bo'lmasa marathon.passPercent);</li>
 *   <li>MARATHON / TOPIC / rejimsiz — marathon.passPercent (90%).</li>
 * </ul>
 *
 * <p>Rejim {@code null} bo'lsa (eski sessiyalar/klientlar) sessiyadan aniqlanadi: bilet → TICKET,
 * paket → PACKAGE, aks holda MARATHON.
 *
 * <p>{@link ExamSession} JPA entity'si Spring bean'larini ololmaydi, shuning uchun joriy siyosat
 * statik {@link #current()} orqali ham ochiq (Spring konteksti yo'q bo'lsa — default qoidalar).
 */
@Component
public class ExamGradingPolicy {

    private static volatile ExamGradingPolicy current = new ExamGradingPolicy(new ExamRules());

    private final ExamRules rules;

    public ExamGradingPolicy(ExamRules rules) {
        this.rules = rules != null ? rules : new ExamRules();
    }

    @PostConstruct
    void register() {
        current = this;
    }

    /** Joriy (Spring tomonidan sozlangan) siyosat; kontekstdan tashqarida default qoidalar. */
    public static ExamGradingPolicy current() {
        return current;
    }

    public ExamRules rules() {
        return rules;
    }

    /**
     * Baholash natijasi.
     *
     * @param passed       o'tdimi
     * @param passingScore natijada ko'rsatiladigan o'tish bali (foiz). REAL/SURVIVAL uchun —
     *                     maxWrong qoidasiga ekvivalent foiz (masalan 20 savol, 3 xato → 85)
     * @param maxWrong     ruxsat etilgan xato + javobsizlar soni (faqat REAL/SURVIVAL, aks holda null)
     * @param mode         baholashda qo'llangan (aniqlangan) rejim
     */
    public record Grade(boolean passed, int passingScore, Integer maxWrong, ExamMode mode) {}

    /**
     * @param mode                 so'ralgan rejim (null — legacy, sessiyadan aniqlanadi)
     * @param hasTicket            sessiya biletga bog'langanmi
     * @param packagePassingScore  paketning o'tish bali (paketsiz bo'lsa null)
     * @param totalQuestions       jami savollar (javobsizlar ham)
     * @param correctCount         to'g'ri javoblar
     */
    public Grade grade(ExamMode mode, boolean hasTicket, Integer packagePassingScore,
                       int totalQuestions, int correctCount) {
        ExamMode effective = resolveMode(mode, hasTicket, packagePassingScore != null);
        int total = Math.max(0, totalQuestions);
        int correct = Math.max(0, Math.min(correctCount, total));
        // javobsiz savollar ham xato hisoblanadi
        int wrongOrUnanswered = total - correct;

        switch (effective) {
            case REAL -> {
                int allowed = allowedWrongForReal(total);
                return new Grade(total > 0 && wrongOrUnanswered <= allowed,
                        equivalentPercent(total, allowed), allowed, effective);
            }
            case SURVIVAL -> {
                int allowed = Math.max(0, rules.getSurvival().getMaxWrong());
                return new Grade(total > 0 && wrongOrUnanswered <= allowed,
                        equivalentPercent(total, allowed), allowed, effective);
            }
            default -> {
                int passPercent = passPercentFor(effective, packagePassingScore);
                double percentage = total > 0 ? (correct * 100.0) / total : 0.0;
                return new Grade(total > 0 && percentage >= passPercent, passPercent, null, effective);
            }
        }
    }

    /** Sessiya bo'yicha baholash (hisoblagichlar allaqachon to'ldirilgan bo'lishi kerak). */
    public Grade grade(ExamSession session) {
        ExamPackage pkg = session.getExamPackage();
        return grade(session.getExamMode(),
                session.getTicket() != null,
                pkg != null ? pkg.getPassingScore() : null,
                session.getTotalQuestions() != null ? session.getTotalQuestions() : 0,
                session.getCorrectCount() != null ? session.getCorrectCount() : 0);
    }

    /** Baholab, {@code isPassed} ni sessiyaga yozadi. */
    public Grade applyTo(ExamSession session) {
        Grade g = grade(session);
        session.setIsPassed(g.passed());
        return g;
    }

    /** REAL: 20 savolga maxWrong; boshqa savol soniga proporsional (pastga yaxlitlanadi). */
    public int allowedWrongForReal(int totalQuestions) {
        int base = Math.max(1, rules.getReal().getQuestionCount());
        return (int) Math.floor((double) rules.getReal().getMaxWrong() * Math.max(0, totalQuestions) / base);
    }

    /** maxWrong qoidasining foizdagi ekvivalenti: ceil((total - allowed) * 100 / total). */
    public static int equivalentPercent(int totalQuestions, int allowedWrong) {
        if (totalQuestions <= 0) {
            return 100;
        }
        int needed = Math.max(0, totalQuestions - allowedWrong);
        return (int) Math.ceil(needed * 100.0 / totalQuestions);
    }

    private int passPercentFor(ExamMode mode, Integer packagePassingScore) {
        return switch (mode) {
            case TICKET -> rules.getTicket().getPassPercent();
            case PACKAGE -> packagePassingScore != null ? packagePassingScore : rules.getMarathon().getPassPercent();
            default -> rules.getMarathon().getPassPercent();
        };
    }

    private static ExamMode resolveMode(ExamMode mode, boolean hasTicket, boolean hasPackage) {
        if (mode != null) {
            return mode;
        }
        if (hasTicket) {
            return ExamMode.TICKET;
        }
        if (hasPackage) {
            return ExamMode.PACKAGE;
        }
        return ExamMode.MARATHON;
    }
}
