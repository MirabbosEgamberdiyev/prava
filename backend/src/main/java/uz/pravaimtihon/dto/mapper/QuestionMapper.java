package uz.pravaimtihon.dto.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.entity.QuestionOption;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.List;

/**
 * Updated QuestionMapper with Topic support
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class QuestionMapper {

    @Autowired
    protected TopicMapper topicMapper;

    public QuestionResponse toResponse(Question question, AcceptLanguage language) {
        if (question == null) {
            return null;
        }

        QuestionResponse.QuestionResponseBuilder builder = QuestionResponse.builder();
        builder.id(question.getId());
        builder.text(question.getText(language));
        builder.explanation(question.getExplanation(language));

        // Map topic with localization
        if (question.getTopic() != null) {
            builder.topic(topicMapper.toSimpleResponse(question.getTopic(), language));
        }

        builder.difficulty(question.getDifficulty());
        builder.correctAnswerIndex(question.getCorrectAnswerIndex());
        builder.imageUrl(question.getImageUrl());
        builder.isActive(question.getIsActive());
        builder.timesUsed(question.getTimesUsed());
        builder.successRate(question.getSuccessRate());

        // Map options
        if (question.getOptions() != null) {
            builder.options(toOptionResponseList(question.getOptions(), language));
        }

        return builder.build();
    }

    public QuestionOptionResponse toOptionResponse(QuestionOption option, AcceptLanguage language) {
        if (option == null) {
            return null;
        }

        return QuestionOptionResponse.builder()
                .id(option.getId())
                .optionIndex(option.getOptionIndex())
                .text(option.getText(language))
                .build();
    }

    public List<QuestionOptionResponse> toOptionResponseList(
            List<QuestionOption> options, AcceptLanguage language) {
        return options.stream()
                .map(o -> toOptionResponse(o, language))
                .toList();
    }

    public List<QuestionResponse> toResponseList(List<Question> questions, AcceptLanguage language) {
        return questions.stream()
                .map(q -> toResponse(q, language))
                .toList();
    }

    public PageResponse<QuestionResponse> toPageResponse(Page<Question> page, AcceptLanguage language) {
        return PageResponse.<QuestionResponse>builder()
                .content(toResponseList(page.getContent(), language))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }

    /**
     * Admin edit uchun barcha 4 til variantini qaytaruvchi mapper.
     */
    public QuestionDetailResponse toDetailResponse(Question question) {
        if (question == null) {
            return null;
        }

        return QuestionDetailResponse.builder()
                .id(question.getId())
                .textUzl(question.getTextUzl())
                .textUzc(question.getTextUzc())
                .textEn(question.getTextEn())
                .textRu(question.getTextRu())
                .explanationUzl(question.getExplanationUzl())
                .explanationUzc(question.getExplanationUzc())
                .explanationEn(question.getExplanationEn())
                .explanationRu(question.getExplanationRu())
                .topicId(question.getTopic() != null ? question.getTopic().getId() : null)
                .topicName(question.getTopic() != null ? question.getTopic().getNameUzl() : null)
                .difficulty(question.getDifficulty() != null ? question.getDifficulty().name() : null)
                .correctAnswerIndex(question.getCorrectAnswerIndex())
                .imageUrl(question.getImageUrl())
                .isActive(question.getIsActive())
                .timesUsed(question.getTimesUsed())
                .successRate(question.getSuccessRate())
                .options(toOptionDetailResponseList(question.getOptions()))
                .build();
    }

    public QuestionOptionDetailResponse toOptionDetailResponse(QuestionOption option) {
        if (option == null) {
            return null;
        }

        return QuestionOptionDetailResponse.builder()
                .id(option.getId())
                .optionIndex(option.getOptionIndex())
                .textUzl(option.getTextUzl())
                .textUzc(option.getTextUzc())
                .textEn(option.getTextEn())
                .textRu(option.getTextRu())
                .build();
    }

    public List<QuestionOptionDetailResponse> toOptionDetailResponseList(List<QuestionOption> options) {
        if (options == null) {
            return List.of();
        }
        return options.stream()
                .map(this::toOptionDetailResponse)
                .toList();
    }
}