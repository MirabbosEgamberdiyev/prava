package uz.pravaimtihon.dto.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.springframework.data.domain.Page;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.dto.response.TopicResponse;
import uz.pravaimtihon.dto.response.TopicSimpleResponse;
import uz.pravaimtihon.entity.Topic;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.List;

/**
 * Mapper for Topic entity with multi-language support
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TopicMapper {

    default TopicResponse toResponse(Topic topic, AcceptLanguage language) {
        if (topic == null) {
            return null;
        }

        return TopicResponse.builder()
                .id(topic.getId())
                .code(topic.getCode())
                .name(topic.getName(language))
                .description(topic.getDescription(language))
                .nameUzl(topic.getNameUzl())
                .nameUzc(topic.getNameUzc())
                .nameEn(topic.getNameEn())
                .nameRu(topic.getNameRu())
                .descriptionUzl(topic.getDescriptionUzl())
                .descriptionUzc(topic.getDescriptionUzc())
                .descriptionEn(topic.getDescriptionEn())
                .descriptionRu(topic.getDescriptionRu())
                .iconUrl(topic.getIconUrl())
                .displayOrder(topic.getDisplayOrder())
                .isActive(topic.getIsActive())
                .questionCount(topic.getQuestionCount())
                .build();
    }

    default TopicSimpleResponse toSimpleResponse(Topic topic, AcceptLanguage language) {
        if (topic == null) {
            return null;
        }

        return TopicSimpleResponse.builder()
                .id(topic.getId())
                .code(topic.getCode())
                .name(topic.getName(language))
                .iconUrl(topic.getIconUrl())
                .build();
    }

    default List<TopicResponse> toResponseList(List<Topic> topics, AcceptLanguage language) {
        return topics.stream()
                .map(t -> toResponse(t, language))
                .toList();
    }

    default List<TopicSimpleResponse> toSimpleResponseList(List<Topic> topics, AcceptLanguage language) {
        return topics.stream()
                .map(t -> toSimpleResponse(t, language))
                .toList();
    }

    default PageResponse<TopicResponse> toPageResponse(Page<Topic> page, AcceptLanguage language) {
        return PageResponse.<TopicResponse>builder()
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
}
