package uz.pravaimtihon.service;

import org.junit.jupiter.api.Test;
import uz.pravaimtihon.controller.PublicExamRulesController.ExamRules;
import uz.pravaimtihon.entity.ExamSession;
import uz.pravaimtihon.enums.ExamMode;

import static org.assertj.core.api.Assertions.assertThat;

/** B-20/B-03/B-04: baholash yagona joyda va exam-rules asosida (Spring kontekstisiz). */
class ExamGradingPolicyTest {

    private final ExamGradingPolicy policy = new ExamGradingPolicy(new ExamRules());

    @Test
    void realExamWithThreeWrongPasses() {
        ExamGradingPolicy.Grade g = policy.grade(ExamMode.REAL, false, null, 20, 17);
        assertThat(g.passed()).isTrue();
        assertThat(g.maxWrong()).isEqualTo(3);
        assertThat(g.passingScore()).isEqualTo(85);
        assertThat(g.mode()).isEqualTo(ExamMode.REAL);
    }

    @Test
    void realExamFailsOnFourthWrong() {
        assertThat(policy.grade(ExamMode.REAL, false, null, 20, 16).passed()).isFalse();
    }

    @Test
    void unansweredCountsAsWrongInRealExam() {
        // 16 to'g'ri, 1 xato, 3 javobsiz → 4 "xato" → yiqiladi
        assertThat(policy.grade(ExamMode.REAL, false, null, 20, 16).passed()).isFalse();
        // 17 to'g'ri, 0 xato, 3 javobsiz → 3 → o'tadi
        assertThat(policy.grade(ExamMode.REAL, false, null, 20, 17).passed()).isTrue();
    }

    @Test
    void realExamAllowanceIsProportionalForOtherSizes() {
        assertThat(policy.allowedWrongForReal(10)).isEqualTo(1);
        assertThat(policy.grade(ExamMode.REAL, false, null, 10, 9).passed()).isTrue();
        assertThat(policy.grade(ExamMode.REAL, false, null, 10, 8).passed()).isFalse();
    }

    @Test
    void marathonNeedsNinetyPercentWithOrWithoutExplicitMode() {
        assertThat(policy.grade(ExamMode.MARATHON, false, null, 20, 18).passed()).isTrue();
        assertThat(policy.grade(ExamMode.MARATHON, false, null, 20, 17).passed()).isFalse();
        // legacy (mode null, paketsiz, biletsiz) → marafon qoidasi
        ExamGradingPolicy.Grade legacy = policy.grade(null, false, null, 20, 17);
        assertThat(legacy.passed()).isFalse();
        assertThat(legacy.passingScore()).isEqualTo(90);
        assertThat(legacy.mode()).isEqualTo(ExamMode.MARATHON);
    }

    @Test
    void ticketUsesRulesPassPercentNotTicketRow() {
        ExamGradingPolicy.Grade g = policy.grade(null, true, 70, 20, 17);
        assertThat(g.mode()).isEqualTo(ExamMode.TICKET);
        assertThat(g.passingScore()).isEqualTo(90);
        assertThat(g.passed()).isFalse();
        assertThat(policy.grade(ExamMode.TICKET, true, null, 20, 18).passed()).isTrue();
    }

    @Test
    void packageKeepsItsOwnPassingScore() {
        ExamGradingPolicy.Grade g = policy.grade(null, false, 70, 20, 14);
        assertThat(g.mode()).isEqualTo(ExamMode.PACKAGE);
        assertThat(g.passingScore()).isEqualTo(70);
        assertThat(g.passed()).isTrue();
    }

    @Test
    void survivalAllowsNoMistakes() {
        assertThat(policy.grade(ExamMode.SURVIVAL, false, null, 15, 15).passed()).isTrue();
        assertThat(policy.grade(ExamMode.SURVIVAL, false, null, 15, 14).passed()).isFalse();
    }

    @Test
    void emptyExamNeverPasses() {
        assertThat(policy.grade(ExamMode.REAL, false, null, 0, 0).passed()).isFalse();
        assertThat(policy.grade(null, false, null, 0, 0).passed()).isFalse();
    }

    @Test
    void appliesToSessionEntity() {
        ExamSession s = ExamSession.builder().examMode(ExamMode.REAL).totalQuestions(20).correctCount(17).build();
        assertThat(policy.applyTo(s).passed()).isTrue();
        assertThat(s.getIsPassed()).isTrue();
    }

    @Test
    void customRulesAreHonoured() {
        ExamRules rules = new ExamRules();
        rules.getReal().setMaxWrong(2);
        rules.getMarathon().setPassPercent(80);
        ExamGradingPolicy custom = new ExamGradingPolicy(rules);
        assertThat(custom.grade(ExamMode.REAL, false, null, 20, 17).passed()).isFalse();
        assertThat(custom.grade(ExamMode.MARATHON, false, null, 20, 16).passed()).isTrue();
    }

    @Test
    void lenientModeParsing() {
        assertThat(ExamMode.fromString("real")).isEqualTo(ExamMode.REAL);
        assertThat(ExamMode.fromString("unknown")).isNull();
        assertThat(ExamMode.fromString(null)).isNull();
        assertThat(ExamMode.fromExamType("ticket_12")).isEqualTo(ExamMode.TICKET);
        assertThat(ExamMode.fromExamType("real")).isEqualTo(ExamMode.REAL);
        assertThat(ExamMode.fromExamType("exam")).isNull();
    }
}
