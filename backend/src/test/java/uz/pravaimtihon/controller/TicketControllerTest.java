package uz.pravaimtihon.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.dto.response.exam.OptionResponse;
import uz.pravaimtihon.dto.response.exam.QuestionResponse;
import uz.pravaimtihon.exception.GlobalExceptionHandler;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.service.MessageService;
import uz.pravaimtihon.service.TicketService;
import uz.pravaimtihon.service.UserThrottlerService;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TicketControllerTest {

    private MockMvc mockMvc;

    @Mock private TicketService ticketService;
    @Mock private MessageService messageService;
    @Mock private UserThrottlerService userThrottlerService;
    @Mock private MessageSource messageSource;

    @InjectMocks
    private TicketController controller;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .build();
    }

    @Test
    void getTicketQuestionsReturnsQuestionsInOrder() throws Exception {
        OptionResponse opt1 = OptionResponse.builder()
                .id(1L)
                .index(0)
                .text(LocalizedText.of("Variant A", "Вариант A", "Option A", "Вариант А"))
                .build();

        OptionResponse opt2 = OptionResponse.builder()
                .id(2L)
                .index(1)
                .text(LocalizedText.of("Variant B", "Вариант B", "Option B", "Вариант Б"))
                .build();

        QuestionResponse q1 = QuestionResponse.builder()
                .id(101L)
                .order(1)
                .text(LocalizedText.of("1-savol", "1-савол", "Q1", "Вопрос 1"))
                .options(List.of(opt1, opt2))
                .correctOptionIndex(0)
                .build();

        QuestionResponse q2 = QuestionResponse.builder()
                .id(102L)
                .order(2)
                .text(LocalizedText.of("2-savol", "2-савол", "Q2", "Вопрос 2"))
                .options(List.of(opt1, opt2))
                .correctOptionIndex(1)
                .build();

        when(ticketService.getTicketQuestions(eq(1L), eq(true))).thenReturn(List.of(q1, q2));

        mockMvc.perform(get("/api/v2/tickets/1/questions?visibleMode=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(101))
                .andExpect(jsonPath("$.data[0].order").value(1))
                .andExpect(jsonPath("$.data[0].correctOptionIndex").value(0))
                .andExpect(jsonPath("$.data[1].id").value(102))
                .andExpect(jsonPath("$.data[1].order").value(2))
                .andExpect(jsonPath("$.data[1].correctOptionIndex").value(1));
    }

    @Test
    void getTicketQuestionsWhenNotFoundReturns404() throws Exception {
        when(ticketService.getTicketQuestions(eq(999L), anyBoolean()))
                .thenThrow(new ResourceNotFoundException("error.ticket.not.found"));

        mockMvc.perform(get("/api/v2/tickets/999/questions"))
                .andExpect(status().isNotFound());
    }
}
