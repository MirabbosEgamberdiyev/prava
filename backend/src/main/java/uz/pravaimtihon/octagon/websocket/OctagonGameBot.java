package uz.pravaimtihon.octagon.websocket;

import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.Random;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.BiConsumer;

@Slf4j
public class OctagonGameBot {

    private final String botId;
    private final String botName;
    private final int botElo;
    private final ActiveMatch match;
    private final ScheduledExecutorService scheduler;
    private final BiConsumer<ActiveMatch, String> onBotProgressCallback;
    private final Runnable onMatchCompleteCheck;
    private final Random random = new Random();

    private volatile boolean isRunning = false;
    private int currentQuestionIndex = 0;

    public OctagonGameBot(String botId, String botName, int botElo,
                          ActiveMatch match,
                          ScheduledExecutorService scheduler,
                          BiConsumer<ActiveMatch, String> onBotProgressCallback,
                          Runnable onMatchCompleteCheck) {
        this.botId = botId;
        this.botName = botName;
        this.botElo = botElo;
        this.match = match;
        this.scheduler = scheduler;
        this.onBotProgressCallback = onBotProgressCallback;
        this.onMatchCompleteCheck = onMatchCompleteCheck;
    }

    public void start() {
        isRunning = true;
        scheduleNextAnswer();
    }

    public void stop() {
        isRunning = false;
    }

    private void scheduleNextAnswer() {
        if (!isRunning || match.isEnded() || currentQuestionIndex >= match.getQuestionIds().size()) {
            match.setPlayer2Finished(true);
            onMatchCompleteCheck.run();
            return;
        }

        // Gaussian thinking time: Mean = 2400ms, StdDev = 600ms, clamped to [1200ms, 4500ms]
        double gaussian = random.nextGaussian();
        long delayMs = Math.round(2400 + (gaussian * 600));
        delayMs = Math.max(1200, Math.min(4500, delayMs));

        scheduler.schedule(() -> {
            if (!isRunning || match.isEnded()) return;

            Long qId = match.getQuestionIds().get(currentQuestionIndex);
            Integer correctOption = match.getCorrectOptions().get(qId);
            int selectedIndex;

            // 65% probability of answering correctly
            boolean willAnswerCorrect = random.nextDouble() < 0.65;
            if (willAnswerCorrect && correctOption != null) {
                selectedIndex = correctOption;
            } else {
                // Pick a wrong option (0..3)
                int wrong = random.nextInt(4);
                if (correctOption != null && wrong == correctOption) {
                    wrong = (wrong + 1) % 4;
                }
                selectedIndex = wrong;
            }

            match.recordAnswer(botId, qId, selectedIndex, Instant.now());
            currentQuestionIndex++;

            // Occasional reaction from bot (15% chance after answering)
            if (random.nextDouble() < 0.15) {
                String[] reactions = {"fire", "thumbs_up", "mindblown"};
                String reaction = reactions[random.nextInt(reactions.length)];
                onBotProgressCallback.accept(match, reaction);
            } else {
                onBotProgressCallback.accept(match, null);
            }

            // Check if match finished
            if (currentQuestionIndex >= match.getQuestionIds().size()) {
                match.setPlayer2Finished(true);
                onMatchCompleteCheck.run();
            } else {
                scheduleNextAnswer();
            }
        }, delayMs, TimeUnit.MILLISECONDS);
    }
}
