package uz.pravaimtihon.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.concurrent.TimeUnit;

/**
 * ✅ Caffeine Cache Configuration - Sodda va 100% ishlaydigan
 * High-performance in-memory caching
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // ============================================
        // TOPICS - 2 soat cache (kam o'zgaradi)
        // ============================================
        cacheManager.registerCustomCache("topics",
                Caffeine.newBuilder()
                        .maximumSize(100)
                        .expireAfterWrite(2, TimeUnit.HOURS)
                        .recordStats()
                        .build());

        cacheManager.registerCustomCache("topicsSimple",
                Caffeine.newBuilder()
                        .maximumSize(100)
                        .expireAfterWrite(2, TimeUnit.HOURS)
                        .recordStats()
                        .build());

        cacheManager.registerCustomCache("topic_stats",
                Caffeine.newBuilder()
                        .maximumSize(100)
                        .expireAfterWrite(15, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        // ============================================
        // QUESTIONS - 30 daqiqa cache
        // ============================================
        cacheManager.registerCustomCache("questions",
                Caffeine.newBuilder()
                        .maximumSize(500)
                        .expireAfterWrite(30, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        cacheManager.registerCustomCache("questionsByTopic",
                Caffeine.newBuilder()
                        .maximumSize(500)
                        .expireAfterWrite(30, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        // ============================================
        // PACKAGES - 30 daqiqa cache
        // ============================================
        cacheManager.registerCustomCache("packages",
                Caffeine.newBuilder()
                        .maximumSize(200)
                        .expireAfterWrite(30, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        // ============================================
        // USER STATS - 10 daqiqa cache
        // ============================================
        cacheManager.registerCustomCache("user_stats",
                Caffeine.newBuilder()
                        .maximumSize(1000)
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        // ============================================
        // LEADERBOARD - 5 daqiqa cache (tez-tez o'zgaradi)
        // ============================================
        cacheManager.registerCustomCache("leaderboard",
                Caffeine.newBuilder()
                        .maximumSize(100)
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        // ============================================
        // DASHBOARD - 10 daqiqa cache
        // ============================================
        cacheManager.registerCustomCache("dashboard_stats",
                Caffeine.newBuilder()
                        .maximumSize(20)
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        return cacheManager;
    }
}