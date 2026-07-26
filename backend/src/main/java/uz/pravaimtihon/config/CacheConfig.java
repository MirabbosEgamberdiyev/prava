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

        // AUDIT: agar kimdir kelajakda bu yerda RO'YXATDAN O'TKAZILMAGAN nom
        // bilan @Cacheable yozsa, CaffeineCacheManager uni dinamik ravishda
        // `Caffeine.newBuilder()` default'lari bilan yaratadi — ya'ni CHEKSIZ,
        // hech qachon eskirmaydigan cache (aynan shu sabab `fileCache` heap'ni
        // to'ldirib yuborishi mumkin edi). Quyidagi default builder shunday
        // "tasodifiy" cache'lar ham hech bo'lmasa chegaralangan bo'lishini
        // ta'minlaydi.
        //
        // MUHIM: `setCaffeine(...)` faqat dinamik yaratiladigan cache'larga
        // ta'sir qiladi; quyida `registerCustomCache(...)` bilan aniq
        // sozlangan cache'lar o'z konfiguratsiyasini saqlab qoladi.
        cacheManager.setCaffeine(
                Caffeine.newBuilder()
                        .maximumSize(500)
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .recordStats());

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

        // ══════════════════════════════════════════════════════════════════
        // ⚠️ AUDIT — XOTIRA SIZIB CHIQISHI (memory leak):
        //
        // Quyidagi cache'lar kodda @Cacheable orqali ISHLATILARDI, lekin bu
        // yerda RO'YXATDAN O'TKAZILMAGAN edi. CaffeineCacheManager esa
        // noma'lum nomdagi cache'ni "dinamik" ravishda `Caffeine.newBuilder()`
        // default sozlamalari bilan yaratadi — ya'ni HAJMI CHEKLANMAGAN va
        // HECH QACHON ESKIRMAYDIGAN cache.
        //
        // Eng xavflisi — `fileCache`: u fayllarning XOM BAYTLARINI saqlaydi
        // (rasm/installer). Servis 512 MB heap bilan ishlaydi
        // (systemd: -Xmx512m), shuning uchun turli fayllar so'ralaverganda
        // heap to'lib, OutOfMemoryError bilan qulashi muqarrar edi.
        //
        // `activeQuestions` esa barcha faol savollarni til bo'yicha saqlaydi
        // va savol o'zgarganda evict qilinmasdi (QuestionService'dagi
        // @CacheEvict ro'yxatida u yo'q) — ya'ni eskirgan ma'lumot abadiy
        // qolib ketardi.
        // ══════════════════════════════════════════════════════════════════

        // Fayl baytlari — hajm bo'yicha cheklangan (taxminan ~64 MB gacha)
        cacheManager.registerCustomCache("fileCache",
                Caffeine.newBuilder()
                        .maximumWeight(64L * 1024 * 1024)
                        .<Object, Object>weigher((k, v) -> (v instanceof byte[] b) ? b.length : 1024)
                        .expireAfterAccess(30, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        cacheManager.registerCustomCache("contentTypeCache",
                Caffeine.newBuilder()
                        .maximumSize(5_000)
                        .expireAfterWrite(1, TimeUnit.HOURS)
                        .recordStats()
                        .build());

        cacheManager.registerCustomCache("fileExistsCache",
                Caffeine.newBuilder()
                        .maximumSize(5_000)
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        // Har bir til uchun barcha faol savollar — kichik hajm, qisqa TTL
        cacheManager.registerCustomCache("activeQuestions",
                Caffeine.newBuilder()
                        .maximumSize(10)
                        .expireAfterWrite(15, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        return cacheManager;
    }
}