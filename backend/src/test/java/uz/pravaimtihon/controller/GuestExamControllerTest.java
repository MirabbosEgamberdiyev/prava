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
                .build();
        q.setId(101L);

        when(questionRepository.findRandomQuestionIds(any(Pageable.class))).thenReturn(List.of(101L));
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
                .andExpect(jsonPath("$.data.questions[0].correctOptionIndex").doesNotExist())
                .andExpect(jsonPath("$.data.questions[0].explanation").doesNotExist());
    }

    @Test
    void submitGuestExamEvaluatesOnServerAndReturnsResults() throws Exception {
        Question q1 = Question.builder()
                .correctAnswerIndex(2)
                .explanationUzl("Qoida 1")
                .build();
        q1.setId(101L);

        when(questionRepository.findByIdsWithOptions(anyList())).thenReturn(List.of(q1));
        when(mapper.toExplanation(q1)).thenReturn(LocalizedText.of("Qoida 1", null, null, null));

        String requestBody = """
                {
                    "answers": [
                        {"questionId": 101, "selectedOptionIndex": 2}
                    ]
                }
                """;

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
    }
}
