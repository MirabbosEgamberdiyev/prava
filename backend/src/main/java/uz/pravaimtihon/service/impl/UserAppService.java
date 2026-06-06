package uz.pravaimtihon.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.dto.response.exam.OptionResponse;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Prava-Desktop-Online uchun user-facing service.
 * Topics, questions, wrong answers, saved questions.
 */
@Service
@RequiredArgsConstructor
public class UserAppService {

    private final TopicService topicService;
    private final UserWrongAnswerRepository wrongAnswerRepo;
    private final UserSavedQuestionRepository savedQuestionRepo;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    // ─── Topics ───────────────────────────────────────────────────────────────

    public List<TopicResponse> getActiveTopics() {
        return topicService.getAllActiveTopics(uz.pravaimtihon.enums.AcceptLanguage.UZL);
    }

    // ─── Questions by topic ───────────────────────────────────────────────────

    public List<uz.pravaimtihon.dto.response.exam.QuestionResponse> getQuestionsByTopic(Long topicId) {
        org.springframework.data.domain.Pageable all =
                org.springframework.data.domain.PageRequest.of(0, 2000);
        org.springframework.data.domain.Page<Question> page =
                questionRepository.findByTopicIdAndDeletedFalseAndIsActiveTrue(topicId, all);
        return page.getContent().stream()
                .map(this::toExamQuestion)
                .collect(Collectors.toList());
    }

    // ─── Wrong Answers ────────────────────────────────────────────────────────

    @Transactional
    public void addWrongAnswer(Long userId, Long questionId) {
        wrongAnswerRepo.findByUserIdAndQuestionId(userId, questionId)
                .ifPresentOrElse(
                        wa -> {
                            wa.setWrongCount(wa.getWrongCount() + 1);
                            wa.setLastSeen(LocalDateTime.now());
                            wrongAnswerRepo.save(wa);
                        },
                        () -> {
                            User user = userRepository.findById(userId)
                                    .orElseThrow(() -> new RuntimeException("User topilmadi"));
                            Question q = questionRepository.findById(questionId)
                                    .orElseThrow(() -> new RuntimeException("Savol topilmadi"));
                            wrongAnswerRepo.save(UserWrongAnswer.builder()
                                    .user(user).question(q)
                                    .wrongCount(1).lastSeen(LocalDateTime.now())
                                    .build());
                        }
                );
    }

    @Transactional(readOnly = true)
    public List<WrongAnswerResponse> getWrongAnswers(Long userId) {
        return wrongAnswerRepo.findByUserIdOrderByLastSeenDesc(userId).stream()
                .map(wa -> {
                    Question q = wa.getQuestion();
                    return WrongAnswerResponse.builder()
                            .questionId(q.getId())
                            .wrongCount(wa.getWrongCount())
                            .lastSeen(wa.getLastSeen())
                            .text(LocalizedText.of(q.getTextUzl(), q.getTextUzc(), q.getTextEn(), q.getTextRu()))
                            .imageUrl(q.getImageUrl())
                            .options(buildOptions(q))
                            .correctOptionIndex(q.getCorrectAnswerIndex())
                            .explanation(LocalizedText.of(
                                    q.getExplanationUzl(), q.getExplanationUzc(),
                                    q.getExplanationEn(), q.getExplanationRu()))
                            .topicId(q.getTopic() != null ? q.getTopic().getId() : null)
                            .topicName(q.getTopic() != null ?
                                    LocalizedText.of(q.getTopic().getNameUzl(), q.getTopic().getNameUzc(),
                                            q.getTopic().getNameEn(), q.getTopic().getNameRu()) : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeWrongAnswer(Long userId, Long questionId) {
        wrongAnswerRepo.deleteByUserIdAndQuestionId(userId, questionId);
    }

    // ─── Saved Questions ──────────────────────────────────────────────────────

    @Transactional
    public boolean toggleSavedQuestion(Long userId, Long questionId) {
        if (savedQuestionRepo.existsByUserIdAndQuestionId(userId, questionId)) {
            savedQuestionRepo.deleteByUserIdAndQuestionId(userId, questionId);
            return false; // o'chirildi
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User topilmadi"));
            Question q = questionRepository.findById(questionId)
                    .orElseThrow(() -> new RuntimeException("Savol topilmadi"));
            savedQuestionRepo.save(UserSavedQuestion.builder()
                    .user(user).question(q)
                    .savedAt(LocalDateTime.now())
                    .build());
            return true; // saqlandi
        }
    }

    @Transactional(readOnly = true)
    public List<SavedQuestionResponse> getSavedQuestions(Long userId) {
        return savedQuestionRepo.findByUserIdOrderBySavedAtDesc(userId).stream()
                .map(sq -> {
                    Question q = sq.getQuestion();
                    return SavedQuestionResponse.builder()
                            .questionId(q.getId())
                            .savedAt(sq.getSavedAt())
                            .text(LocalizedText.of(q.getTextUzl(), q.getTextUzc(), q.getTextEn(), q.getTextRu()))
                            .imageUrl(q.getImageUrl())
                            .options(buildOptions(q))
                            .correctOptionIndex(q.getCorrectAnswerIndex())
                            .explanation(LocalizedText.of(
                                    q.getExplanationUzl(), q.getExplanationUzc(),
                                    q.getExplanationEn(), q.getExplanationRu()))
                            .topicId(q.getTopic() != null ? q.getTopic().getId() : null)
                            .topicName(q.getTopic() != null ?
                                    LocalizedText.of(q.getTopic().getNameUzl(), q.getTopic().getNameUzc(),
                                            q.getTopic().getNameEn(), q.getTopic().getNameRu()) : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isQuestionSaved(Long userId, Long questionId) {
        return savedQuestionRepo.existsByUserIdAndQuestionId(userId, questionId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private uz.pravaimtihon.dto.response.exam.QuestionResponse toExamQuestion(Question q) {
        return uz.pravaimtihon.dto.response.exam.QuestionResponse.builder()
                .id(q.getId())
                .text(LocalizedText.of(q.getTextUzl(), q.getTextUzc(), q.getTextEn(), q.getTextRu()))
                .imageUrl(q.getImageUrl())
                .options(buildOptions(q))
                .correctOptionIndex(q.getCorrectAnswerIndex())
                .explanation(LocalizedText.of(
                        q.getExplanationUzl(), q.getExplanationUzc(),
                        q.getExplanationEn(), q.getExplanationRu()))
                .build();
    }

    private List<OptionResponse> buildOptions(Question q) {
        if (q.getOptions() == null) return List.of();
        return q.getOptions().stream()
                .map(opt -> OptionResponse.builder()
                        .id(opt.getId())
                        .index(opt.getOptionIndex())
                        .text(LocalizedText.of(opt.getTextUzl(), opt.getTextUzc(),
                                opt.getTextEn(), opt.getTextRu()))
                        .build())
                .collect(Collectors.toList());
    }
}
