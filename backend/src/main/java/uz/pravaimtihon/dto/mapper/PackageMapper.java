package uz.pravaimtihon.dto.mapper;

import org.mapstruct.*;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.entity.*;
import uz.pravaimtihon.enums.AcceptLanguage;
import org.springframework.data.domain.Page;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = {QuestionMapper.class})
public interface PackageMapper {

    @Mapping(target = "name", expression = "java(pkg.getName(language))")
    @Mapping(target = "description", expression = "java(pkg.getDescription(language))")
    @Mapping(target = "actualQuestionCount", expression = "java(pkg.getActualQuestionCount())")
    @Mapping(target = "topic", expression = "java(pkg.getTopicCode())")
    @Mapping(target = "topicName", expression = "java(pkg.getTopicName(language))")
    PackageResponse toResponse(ExamPackage pkg, @Context AcceptLanguage language);

    @Mapping(target = "name", expression = "java(pkg.getName(language))")
    @Mapping(target = "description", expression = "java(pkg.getDescription(language))")
    @Mapping(target = "topic", expression = "java(pkg.getTopicCode())")
    @Mapping(target = "topicName", expression = "java(pkg.getTopicName(language))")
    @Mapping(target = "questions", source = "questions")
    PackageDetailResponse toDetailResponse(ExamPackage pkg, @Context AcceptLanguage language);

    List<PackageResponse> toResponseList(List<ExamPackage> packages, @Context AcceptLanguage language);

    default PageResponse<PackageResponse> toPageResponse(Page<ExamPackage> page, AcceptLanguage language) {
        return PageResponse.<PackageResponse>builder()
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
