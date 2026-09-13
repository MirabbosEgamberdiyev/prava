package uz.pravaimtihon.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.pravaimtihon.entity.NewsArticle;

import java.util.Optional;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {

    Optional<NewsArticle> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<NewsArticle> findByIsPublishedTrue(Pageable pageable);

    default Page<NewsArticle> searchNews(Boolean published, String search, Pageable pageable) {
        if (search == null || search.trim().isEmpty()) {
            if (published == null) {
                return findAll(pageable);
            }
            return findByIsPublished(published, pageable);
        }
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return searchNewsInternal(published, pattern, pageable);
    }

    Page<NewsArticle> findByIsPublished(Boolean isPublished, Pageable pageable);

    @Query("SELECT n FROM NewsArticle n WHERE " +
            "(:published IS NULL OR n.isPublished = :published) AND " +
            "(LOWER(n.titleUzl) LIKE :pattern OR LOWER(n.slug) LIKE :pattern)")
    Page<NewsArticle> searchNewsInternal(
            @Param("published") Boolean published,
            @Param("pattern") String pattern,
            Pageable pageable);

    long countByIsPublishedTrue();
}
