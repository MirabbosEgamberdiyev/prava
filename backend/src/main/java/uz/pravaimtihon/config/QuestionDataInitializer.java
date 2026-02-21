package uz.pravaimtihon.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.enums.QuestionDifficulty;
import uz.pravaimtihon.repository.*;

import java.io.InputStream;
import java.util.*;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class QuestionDataInitializer implements CommandLineRunner {

    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final TicketRepository ticketRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.init.question-data.enabled:true}")
    private boolean enabled;

    @Value("${app.init.question-data.force-reimport:false}")
    private boolean forceReimport;

    private static final int QUESTIONS_PER_TICKET = 10;
    private static final int TICKET_DURATION_MINUTES = 15;
    private static final int TICKET_PASSING_SCORE = 70;

    private static final String IMPORT_FILE = "import_data/all_questions_full_translated.json";

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.info("Question data initialization SKIPPED (disabled in config)");
            return;
        }

        log.info("=".repeat(80));
        log.info("QUESTION DATA INITIALIZATION STARTED");
        if (forceReimport) {
            log.info("MODE: FORCE RE-IMPORT (all old data will be deleted)");
        }
        log.info("=".repeat(80));

        try {
            ClassPathResource resource = new ClassPathResource(IMPORT_FILE);
            if (!resource.exists()) {
                log.warn("Import file {} not found in classpath, skipping", IMPORT_FILE);
                return;
            }

            JsonNode root;
            try (InputStream is = resource.getInputStream()) {
                root = objectMapper.readTree(is);
            }

            // Force re-import: delete ALL old data first
            if (forceReimport) {
                deleteAllData();
            } else {
                // Normal mode: only clean up old topics not in the import file
                Set<String> validTopicCodes = new HashSet<>();
                JsonNode topicsNode = root.get("topics");
                if (topicsNode != null && topicsNode.isArray()) {
                    for (JsonNode tNode : topicsNode) {
                        validTopicCodes.add(tNode.get("code").asText());
                    }
                }
                cleanupOldTopics(validTopicCodes);
            }

            // 1. Create or update topics from JSON
            Map<String, Topic> topicMap = createTopics(root.get("topics"));

            // 2. Import questions
            importQuestions(root.get("questions"), topicMap);

            // 3. Create tickets for ALL topics with globally unique ticket numbers
            int globalTicketCounter = ticketRepository.findMaxTicketNumberGlobal();
            for (Map.Entry<String, Topic> entry : topicMap.entrySet()) {
                globalTicketCounter = createTicketsForTopic(entry.getValue(), globalTicketCounter);
            }

            // 4. Log summary
            logSummary(topicMap);

        } catch (Exception e) {
            log.error("Question data initialization FAILED: {}", e.getMessage(), e);
        }

        log.info("=".repeat(80));
        log.info("QUESTION DATA INITIALIZATION COMPLETED");
        log.info("=".repeat(80));
    }

    private void deleteAllData() {
        log.info("Deleting all existing data...");

        // 1. Delete all tickets (clear question associations first)
        List<Ticket> allTickets = ticketRepository.findAll();
        for (Ticket ticket : allTickets) {
            ticket.getQuestions().clear();
        }
        ticketRepository.saveAll(allTickets);
        ticketRepository.deleteAll(allTickets);
        log.info("  Deleted {} tickets", allTickets.size());

        // 2. Delete all question options
        optionRepository.deleteAll();
        log.info("  Deleted all question options");

        // 3. Delete all questions
        long qCount = questionRepository.count();
        questionRepository.deleteAll();
        log.info("  Deleted {} questions", qCount);

        // 4. Delete all topics
        long tCount = topicRepository.count();
        topicRepository.deleteAll();
        log.info("  Deleted {} topics", tCount);

        log.info("All old data deleted successfully");
    }

    private void cleanupOldTopics(Set<String> validTopicCodes) {
        List<Topic> existingTopics = topicRepository.findByDeletedFalse(Pageable.unpaged()).getContent();

        for (Topic topic : existingTopics) {
            if (!validTopicCodes.contains(topic.getCode())) {
                log.info("  Removing old topic '{}' (ID: {})...", topic.getCode(), topic.getId());

                List<Ticket> tickets = ticketRepository.findByTopicIdOrderByTicketNumber(topic.getId());
                for (Ticket ticket : tickets) {
                    ticket.getQuestions().clear();
                    ticket.softDelete("system-cleanup");
                    ticketRepository.save(ticket);
                }

                List<Question> questions = questionRepository.findByTopicIdAndDeletedFalseAndIsActiveTrue(
                        topic.getId(), Pageable.unpaged()).getContent();
                for (Question q : questions) {
                    q.softDelete("system-cleanup");
                    questionRepository.save(q);
                }

                topic.softDelete("system-cleanup");
                topic.setQuestionCount(0L);
                topicRepository.save(topic);

                log.info("  Old topic '{}' removed ({} questions, {} tickets)",
                        topic.getCode(), questions.size(), tickets.size());
            }
        }
    }

    private Map<String, Topic> createTopics(JsonNode topicsNode) {
        Map<String, Topic> topicMap = new LinkedHashMap<>();

        if (topicsNode == null || !topicsNode.isArray()) {
            log.warn("No 'topics' array in import file");
            return topicMap;
        }

        int order = 1;
        for (JsonNode tNode : topicsNode) {
            String code = tNode.get("code").asText();
            Topic topic = getOrCreateTopic(
                    code,
                    getTextOrNull(tNode, "nameUzl"),
                    getTextOrNull(tNode, "nameUzc"),
                    getTextOrNull(tNode, "nameEn"),
                    getTextOrNull(tNode, "nameRu"),
                    order++
            );
            topicMap.put(code, topic);
        }

        log.info("Topics ready: {} total", topicMap.size());
        return topicMap;
    }

    private Topic getOrCreateTopic(String code, String nameUzl, String nameUzc, String nameEn, String nameRu, int displayOrder) {
        Optional<Topic> existing = topicRepository.findByCodeAndDeletedFalse(code);

        if (existing.isPresent()) {
            Topic topic = existing.get();
            topic.setNameUzl(nameUzl);
            topic.setNameUzc(nameUzc);
            topic.setNameEn(nameEn);
            topic.setNameRu(nameRu);
            topic.setDescriptionUzl(nameUzl + " bo'yicha test savollari");
            topic.setDescriptionUzc(nameUzc != null ? nameUzc + " \u0431\u045e\u0439\u0438\u0447\u0430 \u0442\u0435\u0441\u0442 \u0441\u0430\u0432\u043e\u043b\u043b\u0430\u0440\u0438" : null);
            topic.setDescriptionEn(nameEn != null ? "Test questions on " + nameEn : null);
            topic.setDescriptionRu(nameRu != null ? "\u0422\u0435\u0441\u0442\u043e\u0432\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b: " + nameRu : null);
            topic.setDisplayOrder(displayOrder);
            topic.setIsActive(true);
            return topicRepository.save(topic);
        }

        Topic topic = Topic.builder()
                .code(code)
                .nameUzl(nameUzl)
                .nameUzc(nameUzc)
                .nameEn(nameEn)
                .nameRu(nameRu)
                .descriptionUzl(nameUzl + " bo'yicha test savollari")
                .descriptionUzc(nameUzc != null ? nameUzc + " \u0431\u045e\u0439\u0438\u0447\u0430 \u0442\u0435\u0441\u0442 \u0441\u0430\u0432\u043e\u043b\u043b\u0430\u0440\u0438" : null)
                .descriptionEn(nameEn != null ? "Test questions on " + nameEn : null)
                .descriptionRu(nameRu != null ? "\u0422\u0435\u0441\u0442\u043e\u0432\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b: " + nameRu : null)
                .displayOrder(displayOrder)
                .isActive(true)
                .build();
        topic = topicRepository.save(topic);
        log.info("  Topic '{}' created (ID: {})", code, topic.getId());
        return topic;
    }

    private void importQuestions(JsonNode questionsNode, Map<String, Topic> topicMap) {
        if (questionsNode == null || !questionsNode.isArray()) {
            log.warn("No 'questions' array found in import file");
            return;
        }

        int imported = 0;
        int skipped = 0;

        for (JsonNode qNode : questionsNode) {
            String textUzl = qNode.has("textUzl") ? qNode.get("textUzl").asText(null) : null;
            String topicCode = qNode.has("topicCode") ? qNode.get("topicCode").asText("general_rules") : "general_rules";

            Topic topic = topicMap.get(topicCode);
            if (topic == null) {
                topic = topicMap.get("general_rules");
                if (topic == null) {
                    topic = topicMap.values().iterator().next();
                }
            }

            if (textUzl != null && questionRepository.existsByTextUzlAndTopicAndDeletedFalse(textUzl, topic)) {
                skipped++;
                continue;
            }

            Question question = Question.builder()
                    .textUzl(textUzl)
                    .textUzc(getTextOrNull(qNode, "textUzc"))
                    .textEn(getTextOrNull(qNode, "textEn"))
                    .textRu(getTextOrNull(qNode, "textRu"))
                    .explanationUzl(getTextOrNull(qNode, "explanationUzl"))
                    .explanationUzc(getTextOrNull(qNode, "explanationUzc"))
                    .explanationEn(getTextOrNull(qNode, "explanationEn"))
                    .explanationRu(getTextOrNull(qNode, "explanationRu"))
                    .topic(topic)
                    .difficulty(parseDifficulty(qNode))
                    .correctAnswerIndex(qNode.has("correctAnswerIndex") ? qNode.get("correctAnswerIndex").asInt() : 0)
                    .imageUrl(getTextOrNull(qNode, "imageUrl"))
                    .isActive(true)
                    .build();

            question = questionRepository.save(question);

            JsonNode optionsNode = qNode.get("options");
            if (optionsNode != null && optionsNode.isArray()) {
                List<QuestionOption> options = new ArrayList<>();
                for (JsonNode optNode : optionsNode) {
                    QuestionOption option = QuestionOption.builder()
                            .question(question)
                            .optionIndex(optNode.has("optionIndex") ? optNode.get("optionIndex").asInt() : 0)
                            .textUzl(getTextOrNull(optNode, "textUzl"))
                            .textUzc(getTextOrNull(optNode, "textUzc"))
                            .textEn(getTextOrNull(optNode, "textEn"))
                            .textRu(getTextOrNull(optNode, "textRu"))
                            .build();
                    options.add(option);
                }
                optionRepository.saveAll(options);
                question.setOptions(options);
            }

            imported++;
        }

        for (Map.Entry<String, Topic> entry : topicMap.entrySet()) {
            Topic topic = entry.getValue();
            long count = questionRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topic.getId());
            topic.setQuestionCount(count);
            topicRepository.save(topic);
        }

        log.info("Questions imported: {}, skipped (duplicates): {}", imported, skipped);
    }

    /**
     * Creates tickets for a topic with GLOBALLY unique ticket numbers.
     * @return the updated global ticket counter after creating tickets for this topic
     */
    private int createTicketsForTopic(Topic topic, int globalTicketCounter) {
        List<Question> questions = questionRepository.findByTopicIdAndDeletedFalseAndIsActiveTrue(
                topic.getId(), Pageable.unpaged()).getContent();

        if (questions.isEmpty()) {
            return globalTicketCounter;
        }

        int expectedTickets = (int) Math.ceil((double) questions.size() / QUESTIONS_PER_TICKET);
        long existingTicketCount = ticketRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topic.getId());

        if (existingTicketCount >= expectedTickets) {
            log.info("  Topic '{}' already has {} tickets", topic.getCode(), existingTicketCount);
            return globalTicketCounter;
        }

        log.info("  Creating tickets for '{}' ({} questions)...", topic.getCode(), questions.size());

        int localTicketIndex = 0;
        for (int i = 0; i < expectedTickets; i++) {
            int startIdx = i * QUESTIONS_PER_TICKET;
            int endIdx = Math.min(startIdx + QUESTIONS_PER_TICKET, questions.size());
            if (startIdx >= questions.size()) break;

            List<Question> ticketQuestions = questions.subList(startIdx, endIdx);
            if (ticketQuestions.size() < 5) continue;

            // Check if this topic already has a ticket for this question slice (by local index)
            // Use global counter for the ticket number to ensure uniqueness
            localTicketIndex++;

            // Skip if topic already has enough tickets for this slice
            if (localTicketIndex <= existingTicketCount) {
                continue;
            }

            globalTicketCounter++;
            int ticketNum = globalTicketCounter;

            Ticket ticket = Ticket.builder()
                    .ticketNumber(ticketNum)
                    .nameUzl("Bilet #" + ticketNum)
                    .nameUzc("\u0411\u0438\u043b\u0435\u0442 #" + ticketNum)
                    .nameEn("Ticket #" + ticketNum)
                    .nameRu("\u0411\u0438\u043b\u0435\u0442 #" + ticketNum)
                    .descriptionUzl(topic.getNameUzl() + " - " + ticketNum + "-bilet")
                    .descriptionUzc(topic.getNameUzc() != null ? topic.getNameUzc() + " - " + ticketNum + "-\u0431\u0438\u043b\u0435\u0442" : null)
                    .descriptionEn(topic.getNameEn() != null ? topic.getNameEn() + " - Ticket #" + ticketNum : null)
                    .descriptionRu(topic.getNameRu() != null ? topic.getNameRu() + " - \u0411\u0438\u043b\u0435\u0442 #" + ticketNum : null)
                    .topic(topic)
                    .questions(new ArrayList<>(ticketQuestions))
                    .targetQuestionCount(ticketQuestions.size())
                    .durationMinutes(TICKET_DURATION_MINUTES)
                    .passingScore(TICKET_PASSING_SCORE)
                    .isActive(true)
                    .build();

            ticketRepository.save(ticket);
        }

        long totalTickets = ticketRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topic.getId());
        log.info("  Topic '{}': {} tickets (global counter: {})", topic.getCode(), totalTickets, globalTicketCounter);
        return globalTicketCounter;
    }

    private void logSummary(Map<String, Topic> topicMap) {
        log.info("-".repeat(60));
        log.info("IMPORT SUMMARY:");
        long totalQuestions = 0;
        long totalTickets = 0;
        for (Map.Entry<String, Topic> entry : topicMap.entrySet()) {
            Topic topic = entry.getValue();
            long qCount = questionRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topic.getId());
            long tCount = ticketRepository.countByTopicIdAndDeletedFalseAndIsActiveTrue(topic.getId());
            totalQuestions += qCount;
            totalTickets += tCount;
            log.info("  {} : {} questions, {} tickets", entry.getKey(), qCount, tCount);
        }
        log.info("TOTAL: {} topics, {} questions, {} tickets", topicMap.size(), totalQuestions, totalTickets);
        log.info("-".repeat(60));
    }

    private String getTextOrNull(JsonNode node, String field) {
        if (!node.has(field) || node.get(field).isNull()) return null;
        String text = node.get(field).asText();
        return text.isEmpty() ? null : text;
    }

    private QuestionDifficulty parseDifficulty(JsonNode node) {
        if (!node.has("difficulty")) return QuestionDifficulty.MEDIUM;
        try {
            return QuestionDifficulty.valueOf(node.get("difficulty").asText("MEDIUM"));
        } catch (IllegalArgumentException e) {
            return QuestionDifficulty.MEDIUM;
        }
    }
}
