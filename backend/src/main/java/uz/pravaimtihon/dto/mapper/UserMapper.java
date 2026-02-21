package uz.pravaimtihon.dto.mapper;

import org.mapstruct.*;
import org.springframework.data.domain.Page;
import uz.pravaimtihon.dto.response.*;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    // Asl metod – faqat User qabul qiladi
    @Mapping(target = "fullName", expression = "java(user.getFullName())")
    UserResponse toResponse(User user);

    // -----------------------------------------------------------------
    // YANGI: Language bilan ishlaydigan metodlar (AuthService da kerak)
    // -----------------------------------------------------------------

    /** Language qo‘shib chaqiriladigan asosiy metod */
    default UserResponse toResponse(User user, AcceptLanguage language) {
        // Hozircha User da lokalizatsiya qilinadigan maydon yo‘q,
        // shuning uchun oddiy metodni qayta ishlatamiz.
        // Kelajakda rol nomi, xabarlar va h.k. tarjima qilish kerak bo‘lsa shu yerda qilamiz.
        return toResponse(user);
    }

    /** List<User> → List<UserResponse> (Language bilan) */
    default List<UserResponse> toResponseList(List<User> users, AcceptLanguage language) {
        if (users == null) {
            return null;
        }
        return users.stream()
                .map(user -> toResponse(user, language))
                .toList();
    }

    /** List<User> → List<UserResponse> (Language siz – eski kodlar uchun qoldirdim) */
    default List<UserResponse> toResponseList(List<User> users) {
        if (users == null) {
            return null;
        }
        return users.stream()
                .map(this::toResponse)  // bu yerda faqat bitta parametrli metod ishlaydi
                .toList();
    }

    /** Page<User> → PageResponse<UserResponse> (Language bilan) */
    default PageResponse<UserResponse> toPageResponse(Page<User> page, AcceptLanguage language) {
        if (page == null) {
            return PageResponse.<UserResponse>builder().build();
        }
        return PageResponse.<UserResponse>builder()
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

    /** Page<User> → PageResponse<UserResponse> (Language siz – eski kod uchun) */
    default PageResponse<UserResponse> toPageResponse(Page<User> page) {
        // Default til sifatida UZ tanladim, kerak bo‘lsa o‘zgartirishingiz mumkin
        return toPageResponse(page, AcceptLanguage.UZL);
    }
}