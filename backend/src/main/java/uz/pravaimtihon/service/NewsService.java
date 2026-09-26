package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.pravaimtihon.entity.NewsArticle;
import uz.pravaimtihon.exception.BusinessException;
import uz.pravaimtihon.exception.ResourceNotFoundException;
import uz.pravaimtihon.repository.NewsArticleRepository;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class NewsService {

    private final NewsArticleRepository newsRepository;

    @Transactional
    public NewsArticle create(NewsArticle article) {
        article.resetServerManagedFields(); // mass-assignment himoyasi
        article.setViewCount(0L);
        if (article.getSlug() == null || article.getSlug().isBlank()) {
            article.setSlug(generateSlug(article.getTitleUzl()));
        }
        if (newsRepository.existsBySlug(article.getSlug())) {
            article.setSlug(article.getSlug() + "-" + System.currentTimeMillis() % 10000);
        }
        if (Boolean.TRUE.equals(article.getIsPublished()) && article.getPublishedAt() == null) {
            article.setPublishedAt(LocalDateTime.now());
        }
        return newsRepository.save(article);
    }

    @Transactional
    public NewsArticle update(Long id, NewsArticle updated) {
        NewsArticle article = getById(id);
        article.setTitleUzl(updated.getTitleUzl());
        article.setTitleUzc(updated.getTitleUzc());
        article.setTitleRu(updated.getTitleRu());
        article.setDescriptionUzl(updated.getDescriptionUzl());
        article.setDescriptionUzc(updated.getDescriptionUzc());
        article.setDescriptionRu(updated.getDescriptionRu());
        article.setContentUzl(updated.getContentUzl());
        article.setContentUzc(updated.getContentUzc());
        article.setContentRu(updated.getContentRu());
        article.setCoverImageUrl(updated.getCoverImageUrl());
        if (updated.getSlug() != null && !updated.getSlug().isBlank() && !updated.getSlug().equals(article.getSlug())) {
            if (newsRepository.existsBySlug(updated.getSlug())) {
                throw new BusinessException("Bu slug allaqachon mavjud");
            }
            article.setSlug(updated.getSlug());
        }
        return newsRepository.save(article);
    }

    @Transactional
    public NewsArticle togglePublish(Long id, Boolean isPublished) {
        NewsArticle article = getById(id);
        article.setIsPublished(isPublished);
        if (Boolean.TRUE.equals(isPublished) && article.getPublishedAt() == null) {
            article.setPublishedAt(LocalDateTime.now());
        }
        return newsRepository.save(article);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> getAll(Pageable pageable, Boolean published, String search) {
        return newsRepository.searchNews(published, search, pageable);
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> getPublished(Pageable pageable) {
        return newsRepository.findByIsPublishedTrue(pageable);
    }

    @Transactional(readOnly = true)
    public NewsArticle getById(Long id) {
        return newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yangilik topilmadi"));
    }

    @Transactional
    public NewsArticle getBySlugAndIncrementViews(String slug) {
        NewsArticle article = newsRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Yangilik topilmadi"));
        article.setViewCount(article.getViewCount() + 1);
        return newsRepository.save(article);
    }

    @Transactional
    public void delete(Long id) {
        NewsArticle article = getById(id);
        newsRepository.delete(article);
    }

    private String generateSlug(String title) {
        if (title == null) return "news-" + System.currentTimeMillis();
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
