package uz.pravaimtihon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "news_articles", indexes = {
        @Index(name = "idx_news_slug", columnList = "slug", unique = true),
        @Index(name = "idx_news_published", columnList = "is_published"),
        @Index(name = "idx_news_published_at", columnList = "published_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle extends BaseEntity {

    @Column(name = "slug", nullable = false, unique = true, length = 250)
    private String slug;

    @Column(name = "title_uzl", nullable = false, length = 300)
    private String titleUzl;

    @Column(name = "title_uzc", length = 300)
    private String titleUzc;

    @Column(name = "title_ru", length = 300)
    private String titleRu;

    @Column(name = "description_uzl", columnDefinition = "TEXT")
    private String descriptionUzl;

    @Column(name = "description_uzc", columnDefinition = "TEXT")
    private String descriptionUzc;

    @Column(name = "description_ru", columnDefinition = "TEXT")
    private String descriptionRu;

    @Column(name = "content_uzl", columnDefinition = "TEXT")
    private String contentUzl;

    @Column(name = "content_uzc", columnDefinition = "TEXT")
    private String contentUzc;

    @Column(name = "content_ru", columnDefinition = "TEXT")
    private String contentRu;

    @Column(name = "cover_image_url", length = 1000)
    private String coverImageUrl;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = false;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
