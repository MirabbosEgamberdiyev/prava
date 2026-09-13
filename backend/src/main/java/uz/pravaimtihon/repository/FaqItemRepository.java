package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.FaqItem;

import java.util.List;

@Repository
public interface FaqItemRepository extends JpaRepository<FaqItem, Long> {

    List<FaqItem> findByIsActiveTrueOrderBySortOrderAsc();

    List<FaqItem> findByCategoryAndIsActiveTrueOrderBySortOrderAsc(String category);

    default Page<FaqItem> searchFaqs(Boolean active, String category, String search, Pageable pageable) {
        if (search == null || search.trim().isEmpty()) {
            return findFilteredNoSearch(active, category, pageable);
        }
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return searchFaqsWithPattern(active, category, pattern, pageable);
    }

    @Query("SELECT f FROM FaqItem f WHERE " +
            "(:active IS NULL OR f.isActive = :active) AND " +
            "(:category IS NULL OR f.category = :category)")
    Page<FaqItem> findFilteredNoSearch(
            @Param("active") Boolean active,
            @Param("category") String category,
            Pageable pageable);

    @Query("SELECT f FROM FaqItem f WHERE " +
            "(:active IS NULL OR f.isActive = :active) AND " +
            "(:category IS NULL OR f.category = :category) AND " +
            "(LOWER(f.questionUzl) LIKE :pattern OR LOWER(f.answerUzl) LIKE :pattern)")
    Page<FaqItem> searchFaqsWithPattern(
            @Param("active") Boolean active,
            @Param("category") String category,
            @Param("pattern") String pattern,
            Pageable pageable);

    @Query("SELECT DISTINCT f.category FROM FaqItem f")
    List<String> findDistinctCategories();

    long countByIsActiveTrue();
}
