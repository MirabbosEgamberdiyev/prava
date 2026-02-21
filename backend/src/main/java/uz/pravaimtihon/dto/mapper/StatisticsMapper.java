package uz.pravaimtihon.dto.mapper;

import org.mapstruct.*;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.entity.UserStatistics;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.List;

// ============================================
// StatisticsMapper.java
// ============================================
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StatisticsMapper {

    // Asl metod – faqat UserStatistics qabul qiladi
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(stats.getUser().getFullName())")
    @Mapping(target = "successRate", expression = "java(stats.getSuccessRate())")
    @Mapping(target = "accuracy", expression = "java(stats.getAccuracy())")
    UserStatisticsResponse toResponse(UserStatistics stats);

    // Asl list metodi (eski kodlar uchun saqlab qoldik)
    List<UserStatisticsResponse> toResponseList(List<UserStatistics> statsList);

    // ==================================================================
    // YANGI: Language bilan ishlaydigan metodlar (StatisticsService da kerak)
    // ==================================================================

    /**
     * Language qo‘shib chaqiriladigan individual mapping.
     * Hozircha UserStatistics da lokalizatsiya qilinadigan maydon yo‘q
     * (masalan, userName allaqachon fullName orqali olinmoqda),
     * shuning uchun oddiy metodni qayta ishlatamiz.
     * Kelajakda tarjima kerak bo‘lsa shu yerda qo‘shiladi.
     */
    default UserStatisticsResponse toResponse(UserStatistics stats, AcceptLanguage language) {
        return toResponse(stats);
    }

    /**
     * Language bilan ishlaydigan list mapping
     */
    default List<UserStatisticsResponse> toResponseList(List<UserStatistics> statsList, AcceptLanguage language) {
        if (statsList == null) {
            return null;
        }
        return statsList.stream()
                .map(stats -> toResponse(stats, language))
                .toList();
    }
}