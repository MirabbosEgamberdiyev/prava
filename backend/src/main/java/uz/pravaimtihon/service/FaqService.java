package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.FaqItem;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.FaqItemRepository;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class FaqService {

    private final FaqItemRepository faqRepository;

    @Transactional
    public FaqItem create(FaqItem faq) {
        return faqRepository.save(faq);
    }

    @Transactional
    public FaqItem update(Long id, FaqItem updated) {
        FaqItem item = getById(id);
        item.setQuestionUzl(updated.getQuestionUzl());
        item.setQuestionUzc(updated.getQuestionUzc());
        item.setQuestionRu(updated.getQuestionRu());
        item.setAnswerUzl(updated.getAnswerUzl());
        item.setAnswerUzc(updated.getAnswerUzc());
        item.setAnswerRu(updated.getAnswerRu());
        item.setCategory(updated.getCategory());
        item.setSortOrder(updated.getSortOrder());
        item.setIsActive(updated.getIsActive());
        return faqRepository.save(item);
    }

    @Transactional(readOnly = true)
    public Page<FaqItem> getAll(Pageable pageable, Boolean active, String category, String search) {
        return faqRepository.searchFaqs(active, category, search, pageable);
    }

    @Transactional(readOnly = true)
    public List<FaqItem> getPublicFaqs(String category) {
        if (category != null && !category.isBlank()) {
            return faqRepository.findByCategoryAndIsActiveTrueOrderBySortOrderAsc(category);
        }
        return faqRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return faqRepository.findDistinctCategories();
    }

    @Transactional(readOnly = true)
    public FaqItem getById(Long id) {
        return faqRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FAQ topilmadi"));
    }

    @Transactional
    public void delete(Long id) {
        FaqItem item = getById(id);
        faqRepository.delete(item);
    }
}
