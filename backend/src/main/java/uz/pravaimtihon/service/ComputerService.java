package uz.pravaimtihon.service;

import uz.pravaimtihon.dto.request.ComputerRequest;
import uz.pravaimtihon.dto.response.ComputerResponse;
import uz.pravaimtihon.dto.response.PageResponse;
import uz.pravaimtihon.entity.ComputerStatus;

import java.util.List;

/** Kompyuterlarni boshqarish xizmati. */
public interface ComputerService {

    /** Yangi kompyuter yaratish. */
    ComputerResponse create(ComputerRequest request, String operator);

    /** Mavjud kompyuterni yangilash. */
    ComputerResponse update(Long id, ComputerRequest request, String operator);

    /** Sahifalangan, filtrlangan ro'yxat. */
    PageResponse<ComputerResponse> list(
            Long lcId, String search, ComputerStatus status,
            int page, int size, String sortBy, String sortDir
    );

    /** ID bo'yicha bitta kompyuter. */
    ComputerResponse getById(Long id);

    /** Berilgan o'quv markazi uchun faol kompyuterlar (dropdown uchun). */
    List<ComputerResponse> listActiveByLearningCenter(Long lcId);

    /** Barcha faol kompyuterlar — global dropdown uchun. */
    List<ComputerResponse> listAllActive();

    /** Kompyuter holatini o'zgartirish. */
    ComputerResponse setStatus(Long id, ComputerStatus status, String operator);

    /**
     * Kompyuterni soft-delete.
     * Faqat INACTIVE va faol kodlari yo'q kompyuterlarni o'chirish mumkin.
     */
    void delete(Long id, String operator);
}
