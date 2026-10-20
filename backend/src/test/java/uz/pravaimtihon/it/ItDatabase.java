package uz.pravaimtihon.it;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.net.URI;

/**
 * Integratsion testlar uchun haqiqiy PostgreSQL manbai.
 *
 * <ul>
 *   <li>{@code IT_JDBC_URL} (+ {@code IT_JDBC_USER}, {@code IT_JDBC_PASSWORD}) berilgan bo'lsa — o'sha baza
 *       (Docker'siz ishlab chiqish mashinasi uchun). Testlar {@code ddl-auto=create-drop} bilan sxemani o'chirib
 *       yaratadi, shuning uchun faqat lokal host va nomida {@code _it}/{@code test} bo'lgan baza qabul qilinadi.</li>
 *   <li>Aks holda Docker mavjud bo'lsa — Testcontainers {@code postgres:16-alpine} (CI'dagi odatiy yo'l).</li>
 *   <li>Ikkalasi ham bo'lmasa — testlar o'tkazib yuboriladi.</li>
 * </ul>
 */
final class ItDatabase {

    private static PostgreSQLContainer<?> container;

    private ItDatabase() {
    }

    /** JUnit {@code @EnabledIf} sharti. */
    static boolean available() {
        return externalUrl() != null || dockerAvailable();
    }

    static synchronized void register(DynamicPropertyRegistry registry) {
        String url = externalUrl();
        if (url != null) {
            requireDisposable(url);
            registry.add("spring.datasource.url", () -> url);
            registry.add("spring.datasource.username", () -> env("IT_JDBC_USER", "postgres"));
            registry.add("spring.datasource.password", () -> env("IT_JDBC_PASSWORD", ""));
            return;
        }
        if (container == null) {
            container = new PostgreSQLContainer<>("postgres:16-alpine");
            container.start();
        }
        registry.add("spring.datasource.url", container::getJdbcUrl);
        registry.add("spring.datasource.username", container::getUsername);
        registry.add("spring.datasource.password", container::getPassword);
    }

    private static String externalUrl() {
        String url = System.getenv("IT_JDBC_URL");
        return url == null || url.isBlank() ? null : url.trim();
    }

    private static String env(String name, String fallback) {
        String v = System.getenv(name);
        return v == null ? fallback : v;
    }

    private static boolean dockerAvailable() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable e) {
            return false;
        }
    }

    /** Sxema create-drop qilinadi — production yoki umumiy bazaga tasodifan ulanib qolmaslik uchun. */
    private static void requireDisposable(String jdbcUrl) {
        URI uri = URI.create(jdbcUrl.replaceFirst("^jdbc:", ""));
        String host = uri.getHost() == null ? "" : uri.getHost();
        String db = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
        boolean localHost = host.equals("localhost") || host.equals("127.0.0.1") || host.equals("::1");
        boolean disposableName = db.endsWith("_it") || db.contains("test");
        if (!localHost || !disposableName) {
            throw new IllegalStateException("IT_JDBC_URL must point to a local throw-away database "
                    + "(host localhost/127.0.0.1, name ending in _it or containing 'test'): " + host + "/" + db);
        }
    }
}
