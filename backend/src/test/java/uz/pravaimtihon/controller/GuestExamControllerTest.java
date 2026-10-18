package uz.pravaimtihon.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import uz.pravaimtihon.controller.PublicExamRulesController.ExamRules;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.repository.ExamPackageRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TicketRepository;
import uz.pravaimtihon.repository.TopicRepository;
import uz.pravaimtihon.service.ExamGradingPolicy;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GuestExamControllerTest {

    private MockMvc mockMvc;

    @Mock private QuestionRepository questionRepository;
    @Mock private ExamPackageRepository packageRepository;
    @Mock private TopicRepository topicRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private ExamResponseMapper mapper;
    @Mock private ExamGradingPolicy gradingPolicy;

    @InjectMocks
    private GuestExamController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        ExamRules props = new ExamRules();
        props.getGuest().setQuestionCount(20);
        props.getGuest().setSecondsPerQuestion(60);
        props.getGuest().setMaxWrong(3);
        when(gradingPolicy.rules()).thenReturn(props);
    }

    @Test
    void getGuestExamNeverExposesCorrectAnswersOrExplanations() throws Exception {
        Question q = Question.builder()
                .textUzl("Savol 1")
                .correctAnswerIndex(2)
                .explanationUzl("Izoh 1")
                .isDemo(true)
                .build();
        q.setId(101L);

        when(questionRepository.findRandomDemoQuestionIds(any(Pageable.class))).thenReturn(List.of(101L));
        when(questionRepository.findByIdsWithOptions(anyList())).thenReturn(List.of(q));

        // When mapper is called with visibleMode=false, correctOptionIndex must be null
        QuestionResponse qResp = QuestionResponse.builder()
                .id(101L)
                .text(LocalizedText.of("Savol 1", null, null, null))
                .options(List.of())
                .correctOptionIndex(null)
                .explanation(null)
                .build();

        when(mapper.toQuestionResponses(anyList(), eq(false))).thenReturn(List.of(qResp));

        mockMvc.perform(get("/api/v1/public/guest-exam"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isVisibleMode").value(false))
                .andExpect(jsonPath("$.data.examSessionId").isString())
                .andExpect(jsonPath("$.data.questions[0].correctOptionIndex").doesNotExist())
                .andExpect(jsonPath("$.data.questions[0].explanation").doesNotExist());
    }

    @Test
    void submitGuestExamEvaluatesOnServerAndPreventsDuplicateOrAlienSubmissions() throws Exception {
        Question q1 = Question.builder()
                .correctAnswerIndex(2)
                .explanationUzl("Qoida 1")
                .isDemo(true)
                .build();
        q1.setId(101L);

        when(questionRepository.findRandomDemoQuestionIds(any(Pageable.class))).thenReturn(List.of(101L));
        when(questionRepository.findByIdsWithOptions(anyList())).thenReturn(List.of(q1));
        when(mapper.toQuestionResponses(anyList(), eq(false))).thenReturn(List.of(QuestionResponse.builder().id(101L).build()));

        // 1. First get guest exam to obtain valid session ID
        String getResponse = mockMvc.perform(get("/api/v1/public/guest-exam"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.JsonNode rootNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(getResponse);
        String sessionId = rootNode.path("data").path("examSessionId").asText();
        org.junit.jupiter.api.Assertions.assertFalse(sessionId.isBlank());

        when(questionRepository.findActiveDemoIdsAmong(anyList())).thenReturn(List.of(101L));
        when(mapper.toExplanation(q1)).thenReturn(LocalizedText.of("Qoida 1", null, null, null));

        String requestBody = """
                {
                    "examSessionId": "%s",
                    "answers": [
                        {"questionId": 101, "selectedOptionIndex": 2}
                    ]
                }
                """.formatted(sessionId);

        // 2. First submission should succeed
        mockMvc.perform(post("/api/v1/public/guest-exam/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalQuestions").value(1))
                .andExpect(jsonPath("$.data.correctCount").value(1))
                .andExpect(jsonPath("$.data.incorrectCount").value(0))
                .andExpect(jsonPath("$.data.passed").value(true))
                .andExpect(jsonPath("$.data.results[0].correctOptionIndex").value(2))
                .andExpect(jsonPath("$.data.results[0].isCorrect").value(true))
                .andExpect(jsonPath("$.data.results[0].explanation.uzl").value("Qoida 1"));

        // 3. Second submission of the same session must return 400 Bad Request
        mockMvc.perform(post("/api/v1/public/guest-exam/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void submitGuestExamWithAlienQuestionIsRejected() throws Exception {
        Question q1 = Question.builder()
                .correctAnswerIndex(2)
                .isDemo(true)
                .build();
        q1.setId(101L);

        when(questionRepository.findRandomDemoQuestionIds(any(Pageable.class))).thenReturn(List.of(101L));
        when(questionRepository.findByIdsWithOptions(anyList())).thenReturn(List.of(q1));
        when(mapper.toQuestionResponses(anyList(), eq(false))).thenReturn(List.of(QuestionResponse.builder().id(101L).build()));

        String getResponse = mockMvc.perform(get("/api/v1/public/guest-exam"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.JsonNode rootNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(getResponse);
        String sessionId = rootNode.path("data").path("examSessionId").asText();

        // Alien question ID 999 not in session
        String requestBody = """
                {
                    "examSessionId": "%s",
                    "answers": [
                        {"questionId": 999, "selectedOptionIndex": 1}
                    ]
                }
                """.formatted(sessionId);

        mockMvc.perform(post("/api/v1/public/guest-exam/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
