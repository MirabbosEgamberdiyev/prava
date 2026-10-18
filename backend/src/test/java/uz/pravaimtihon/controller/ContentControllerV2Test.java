package uz.pravaimtihon.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import uz.pravaimtihon.dto.mapper.ExamResponseMapper;
import uz.pravaimtihon.dto.mapper.TopicMapper;
import uz.pravaimtihon.dto.response.TopicResponse;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;
import uz.pravaimtihon.exception.GlobalExceptionHandler;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TicketRepository;
import uz.pravaimtihon.repository.TopicRepository;
import uz.pravaimtihon.service.OfflineBundleService;
import uz.pravaimtihon.service.UserThrottlerService;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ContentControllerV2Test {

    private MockMvc mockMvc;

    @Mock private QuestionRepository questionRepository;
    @Mock private TopicRepository topicRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private OfflineBundleService offlineBundleService;
    @Mock private TopicMapper topicMapper;
    @Mock private ExamResponseMapper examResponseMapper;
    @Mock private UserThrottlerService userThrottlerService;
    @Mock private org.springframework.context.MessageSource messageSource;

    @InjectMocks
    private ContentControllerV2 controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .build();
    }

    @Test
    void getManifestReturns200WithCountsAndEtag() throws Exception {
        when(offlineBundleService.currentVersion()).thenReturn("v2-1272.100-42.100-64.100");
        when(questionRepository.countByDeletedFalseAndIsActiveTrue()).thenReturn(1272L);
        when(ticketRepository.countActiveTickets()).thenReturn(64L);
        when(topicRepository.countByDeletedFalseAndIsActiveTrue()).thenReturn(42L);
        when(ticketRepository.countTicketQuestions()).thenReturn(1276L);

        mockMvc.perform(get("/api/v2/content/manifest"))
                .andExpect(status().isOk())
                .andExpect(header().string("ETag", "\"v2-1272.100-42.100-64.100\""))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").value("v2-1272.100-42.100-64.100"))
                .andExpect(jsonPath("$.data.totalQuestions").value(1272))
                .andExpect(jsonPath("$.data.totalTickets").value(64))
                .andExpect(jsonPath("$.data.totalTopics").value(42))
                .andExpect(jsonPath("$.data.totalTicketQuestions").value(1276));
    }

    @Test
    void getManifestWithMatchingIfNoneMatchReturns304() throws Exception {
        when(offlineBundleService.currentVersion()).thenReturn("v2-1272.100-42.100-64.100");

        mockMvc.perform(get("/api/v2/content/manifest")
                        .header("If-None-Match", "\"v2-1272.100-42.100-64.100\""))
                .andExpect(status().isNotModified())
                .andExpect(header().string("ETag", "\"v2-1272.100-42.100-64.100\""));
    }

    @Test
    void getTopicsReturnsListSorted() throws Exception {
        Topic mockTopic = new Topic();
        mockTopic.setId(1L);
        mockTopic.setCode("YHQ");

        TopicResponse response = TopicResponse.builder()
                .id(1L)
                .code("YHQ")
                .name("Yo'l harakati qoidalari")
                .displayOrder(1)
                .build();

        when(topicRepository.findAllActiveOrderByDisplayOrder()).thenReturn(List.of(mockTopic));
        when(topicMapper.toResponseList(anyList(), eq(AcceptLanguage.UZL))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v2/topics")
                        .header("Accept-Language", "uzl"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].code").value("YHQ"));
    }

    @Test
    void getQuestionsReturnsPaginatedList() throws Exception {
        Question q = new Question();
        q.setId(10L);

        QuestionResponse qResp = QuestionResponse.builder()
                .id(10L)
                .order(1)
                .text(LocalizedText.of("Savol matni", "Савол матни", "Question text", "Текст вопроса"))
                .build();

        when(questionRepository.findByDeletedFalseAndIsActiveTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(q), PageRequest.of(0, 20), 1));
        when(examResponseMapper.toQuestionResponses(anyList(), eq(false)))
                .thenReturn(List.of(qResp));

        mockMvc.perform(get("/api/v2/questions?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(10))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void getQuestionByIdReturnsQuestionDetail() throws Exception {
        Question q = new Question();
        q.setId(42L);

        QuestionResponse qResp = QuestionResponse.builder()
                .id(42L)
                .order(1)
                .text(LocalizedText.of("42-savol", "42-савол", "Q42", "Вопрос 42"))
                .build();

        when(questionRepository.findByIdWithOptions(42L)).thenReturn(Optional.of(q));
        when(examResponseMapper.toQuestionResponse(eq(q), eq(1), eq(true))).thenReturn(qResp);

        mockMvc.perform(get("/api/v2/questions/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(42));
    }

    @Test
    void getQuestionByIdNotFoundReturns404() throws Exception {
        when(questionRepository.findByIdWithOptions(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v2/questions/999"))
                .andExpect(status().isNotFound());
    }
}
