package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.dto.response.exam.LocalizedText;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.Ticket;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.TicketRepository;
import uz.pravaimtihon.repository.TopicRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * B-10: mehmonlar uchun faqat-o'qish katalogi (biletlar va mavzular ro'yxati).
 *
 * <p>Savol matnlari, variantlar va to'g'ri javoblar QAYTARILMAYDI — faqat nomlar, sonlar va
 * kirish belgisi ({@code isFree}). Savollar faqat autentifikatsiyadan va to'lov tekshiruvidan
 * keyin (start-* endpointlari) beriladi.
 */
@Service
@RequiredArgsConstructor
public class PublicCatalogService {

    private final TicketRepository ticketRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;

    public record PublicTicket(Long id, Integer ticketNumber, LocalizedText name,
                               Long topicId, LocalizedText topicName,
                               Long packageId, Boolean isFree, Integer questionCount) {}

    public record PublicTopic(Long id, String code, LocalizedText name, Integer displayOrder,
                              String iconUrl, Long questionCount) {}

    @Transactional(readOnly = true)
    public List<PublicTicket> tickets() {
        return ticketRepository.findAllActiveOrderByNumber().stream()
                .map(PublicCatalogService::toPublicTicket)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicTopic> topics() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : questionRepository.countActiveQuestionsGroupedByTopic()) {
            if (row[0] != null) {
                counts.put(((Number) row[0]).longValue(), row[1] == null ? 0L : ((Number) row[1]).longValue());
            }
        }
        return topicRepository.findAllActiveOrderByDisplayOrder().stream()
                .map(t -> new PublicTopic(t.getId(), t.getCode(), topicName(t), t.getDisplayOrder(),
                        t.getIconUrl(), counts.getOrDefault(t.getId(), 0L)))
                .toList();
    }

    private static PublicTicket toPublicTicket(Ticket t) {
        Topic topic = t.getTopic();
        ExamPackage pkg = t.getExamPackage();
        // Paketsiz bilet — bepul; paketdagi bilet — paket bepul bo'lsa bepul (aks holda to'lov kerak).
        boolean isFree = pkg == null || Boolean.TRUE.equals(pkg.getIsFree());
        return new PublicTicket(
                t.getId(),
                t.getTicketNumber(),
                LocalizedText.of(t.getNameUzl(), t.getNameUzc(), t.getNameEn(), t.getNameRu()),
                topic != null ? topic.getId() : null,
                topic != null ? topicName(topic) : null,
                pkg != null ? pkg.getId() : null,
                isFree,
                // savollar kolleksiyasi yuklanmagan bo'lsa targetQuestionCount qaytadi (N+1 yo'q)
                t.getQuestionCount());
    }

    private static LocalizedText topicName(Topic t) {
        return LocalizedText.of(t.getNameUzl(), t.getNameUzc(), t.getNameEn(), t.getNameRu());
    }
}
