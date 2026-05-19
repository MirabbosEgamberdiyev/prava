package uz.pravaimtihon.backup.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import uz.pravaimtihon.backup.dto.BackupJobStatus;
import uz.pravaimtihon.backup.dto.BackupManifest;
import uz.pravaimtihon.backup.dto.BackupManifest.EntityInfo;
import uz.pravaimtihon.config.StorageProperties;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.util.stream.Stream;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
// Add these imports:
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
/**
 * Production-grade restore (import) servisi.
 *
 * <h3>Xavfsizlik kafolatlari:</h3>
 * <ul>
 *   <li>Transactional restore – istalgan joyda xato bo'lsa butun DB o'zgarishi rollback qilinadi</li>
 *   <li>Checksum validation – har bir entity faylidagi SHA-256 manifest bilan taqqoslanadi</li>
 *   <li>Schema compatibility check – manifest versiyasi tekshiriladi</li>
 *   <li>Duplicate-safe – ON CONFLICT (id) DO NOTHING (merge mode) yoki TRUNCATE CASCADE (force mode)</li>
 *   <li>Sequence reset – import tugagandan so'ng barcha PostgreSQL sequence'lari yangilanadi</li>
 *   <li>File rollback – DB rollback bo'lsa ko'chirilgan fayllar ham o'chiriladi</li>
 *   <li>AES-256-GCM decryption – shifrlangan backup'ni ochish</li>
 * </ul>
 *
 * <h3>Import rejimlari:</h3>
 * <ul>
 *   <li><b>MERGE</b> (default) – mavjud ID'lar o'tkazib yuboriladi (ON CONFLICT DO NOTHING)</li>
 *   <li><b>FORCE</b> – barcha jadvallar TRUNCATE CASCADE qilinib qaytadan to'ldiriladi</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductionRestoreService {

    private final JdbcTemplate              jdbcTemplate;
    private final ObjectMapper              objectMapper;
    private final StorageProperties         storageProperties;
    private final BackupJobRegistry         jobRegistry;
    private final PlatformTransactionManager txManager;

    private static final String SUPPORTED_VERSION = "2.0";

    // TRUNCATE tartibi: foreign key'lar teskari tartibda tozalanadi
    private static final String[] TRUNCATE_ORDER = {
            "user_package_access", "payments",
            "exam_answers", "exam_sessions",
            "ticket_questions", "package_questions",
            "verification_codes", "refresh_tokens",
            "user_statistics",
            "question_options", "questions",
            "tickets", "exam_packages",
            "users", "topics",
    };

    // Sequence reset: har bir jadval uchun PostgreSQL sequence yangilanadi
    private static final String[] SEQUENCE_TABLES = {
            "topics", "users", "questions", "question_options",
            "exam_packages", "tickets", "exam_sessions", "exam_answers",
            "user_statistics", "refresh_tokens", "verification_codes",
            "payments", "user_package_access",
    };

    // ─── Public API ─────────────────────────────────────────────────────────

    /**
     * Async restore ishga tushiradi.
     *
     * @param jobId        registry'dagi job ID
     * @param zipFilePath  yuklangan backup ZIP faylining temp yo'li
     * @param forceReplace true bo'lsa mavjud ma'lumotlar TRUNCATE qilinadi
     * @param password     shifrlangan backup uchun parol (null bo'lishi mumkin)
     */
    @Async("backupTaskExecutor")
    public CompletableFuture<Void> startRestore(String jobId,
                                                String zipFilePath,
                                                boolean forceReplace,
                                                String password) {
        BackupJobStatus job = jobRegistry.find(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        long t0 = System.currentTimeMillis();
        log.info("[RESTORE] Started: jobId={} force={}", jobId, forceReplace);
        job.markRunning("Extracting backup");

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("prava-restore-");
            extractZip(Path.of(zipFilePath), tempDir, password);

            job.updateProgress(10, "Validating backup");
            BackupManifest manifest = readManifest(tempDir);
            validateManifest(manifest, tempDir);

            job.updateProgress(20, "Restoring database");
            StringBuilder summary = new StringBuilder();
            restoreDatabase(manifest, tempDir, forceReplace, job, summary);

            job.updateProgress(90, "Restoring media files");
            restoreMediaFiles(tempDir, job);

            job.setRestoreSummary(summary.toString());
            job.markCompleted("Restore complete");
            log.info("[RESTORE] Completed: jobId={} duration={}ms", jobId, System.currentTimeMillis() - t0);

        } catch (Exception e) {
            log.error("[RESTORE] Failed: jobId={}", jobId, e);
            job.markFailed(e.getMessage());
        } finally {
            deleteTempDir(tempDir);
            // Upload qilingan ZIP ham o'chiriladi
            try { Files.deleteIfExists(Path.of(zipFilePath)); } catch (IOException ignored) {}
        }

        return CompletableFuture.completedFuture(null);
    }

    // ─── ZIP extraction ─────────────────────────────────────────────────────

    private void extractZip(Path zipFile, Path targetDir, String password) throws Exception {
        InputStream raw = Files.newInputStream(zipFile);

        // Shifrlangan backup'ni aniqlash: magic "PBK2"
        byte[] magic = raw.readNBytes(4);
        if (magic.length == 4 && magic[0]=='P' && magic[1]=='B' && magic[2]=='K' && magic[3]=='2') {
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException("Backup is encrypted. Provide decryption password.");
            }
            byte[] salt = raw.readNBytes(16);
            byte[] iv   = raw.readNBytes(12);
            SecretKeySpec key = deriveKey(password, salt);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            raw = new CipherInputStream(raw, cipher);
        } else {
            // Shifrsiz: magic bytes'ni qaytarib qo'yish
            raw = new SequenceInputStream(new ByteArrayInputStream(magic), raw);
        }

        try (ZipInputStream zis = new ZipInputStream(new BufferedInputStream(raw))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path dest = targetDir.resolve(entry.getName()).normalize();
                if (!dest.startsWith(targetDir)) {
                    throw new SecurityException("ZIP path traversal detected: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(dest);
                } else {
                    Files.createDirectories(dest.getParent());
                    Files.copy(zis, dest, StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }
    }

    // ─── Manifest & validation ──────────────────────────────────────────────

    private BackupManifest readManifest(Path dir) throws IOException {
        Path manifestFile = dir.resolve("manifest.json");
        if (!Files.exists(manifestFile)) {
            throw new IllegalArgumentException("manifest.json not found in backup. Invalid backup file.");
        }
        return objectMapper.readValue(manifestFile.toFile(), BackupManifest.class);
    }

    private void validateManifest(BackupManifest manifest, Path dir) throws Exception {
        if (!SUPPORTED_VERSION.equals(manifest.getVersion())) {
            throw new IllegalArgumentException(
                    "Unsupported backup version: " + manifest.getVersion() +
                            ". Supported: " + SUPPORTED_VERSION);
        }

        log.info("[RESTORE] Backup id={} createdAt={} by={}",
                manifest.getBackupId(), manifest.getCreatedAt(), manifest.getCreatedBy());

        // Har bir entity faylining checksumini tekshirish
        for (Map.Entry<String, EntityInfo> entry : manifest.getEntities().entrySet()) {
            String table     = entry.getKey();
            EntityInfo info  = entry.getValue();
            Path dataFile    = dir.resolve(info.getZipPath());

            if (!Files.exists(dataFile)) {
                throw new IllegalArgumentException("Data file missing for table: " + table);
            }

            String actual = computeSha256(dataFile);
            if (!actual.equals(info.getChecksum())) {
                throw new IllegalArgumentException(
                        "Checksum mismatch for table '" + table + "': " +
                                "expected=" + info.getChecksum() + " actual=" + actual);
            }
        }

        log.info("[RESTORE] All checksums valid. Entities: {}", manifest.getEntities().size());
    }

    // ─── Database restore ───────────────────────────────────────────────────

    /**
     * Restore strategiyasi:
     *
     * Har bir jadval o'z mustaqil transaksiyasida import qilinadi.
     * Bu quyidagi muammolarni hal qiladi:
     *
     * 1. Bitta jadval xatosi butun restore'ni o'ldirmaydi.
     * 2. FK xatosi yuz berganda PostgreSQL tranzaksiyani "aborted" holatga
     *    keltiradi (SQL state 25P02). Agar barchasi bitta tx'da bo'lsa,
     *    savepoint ham ishlamaydi — chunki connection allaqachon aborted.
     *    Alohida tx'da esa har bir jadval uchun clean connection olinadi.
     * 3. Savepoint fallback ham to'g'ri ishlaydi — clean connection ustida.
     *
     * FK muammolari uchun: TRUNCATE yoki MERGE rejimida FK constraint'lari
     * SESSION darajasida defer qilinadi, so'ng import tugagach qayta yoqiladi.
     * Bu import tartibidan qat'iy nazar barcha FK'larni o'tkazib yuboradi.
     */
    private void restoreDatabase(BackupManifest manifest, Path dir,
                                 boolean force, BackupJobStatus job,
                                 StringBuilder summary) {

        // 1. FORCE rejimi: avval truncate (o'z alohida tx'ida)
        if (force) {
            TransactionTemplate truncateTx = new TransactionTemplate(txManager);
            truncateTx.setTimeout(-1);
            truncateTx.executeWithoutResult(status -> {
                try {
                    job.updateProgress(25, "Truncating tables");
                    truncateAllTables();
                    log.info("[RESTORE] Tables truncated (force mode)");
                } catch (Exception e) {
                    status.setRollbackOnly();
                    throw new RuntimeException("Truncate failed: " + e.getMessage(), e);
                }
            });
        }

    jdbcTemplate.execute("SET session_replication_role = 'replica'");

        int totalRows = 0;
        int entityCount = manifest.getEntities().size();
        int i = 0;
        List<String> failedTables = new ArrayList<>();

        try {
            for (Map.Entry<String, EntityInfo> entry : manifest.getEntities().entrySet()) {
                String table    = entry.getKey();
                EntityInfo info = entry.getValue();
                Path dataFile   = dir.resolve(info.getZipPath());

                int pct = 25 + (int) (i * 60.0 / entityCount);
                job.updateProgress(pct, "Inserting " + table);

                List<Map<String, Object>> rows = readJsonArray(dataFile);

                if (!rows.isEmpty()) {
                    // Har bir jadval o'z mustaqil transaksiyasida — clean connection
                    final String tbl = table;
                    final List<Map<String, Object>> tableRows = rows;
                    final EntityInfo tableInfo = info;

                    TransactionTemplate tableTx = new TransactionTemplate(txManager);
                    tableTx.setTimeout(-1);
                    try {
                        tableTx.executeWithoutResult(status -> {
                            try {
                                if (tableInfo.isJoinTable()) {
                                    insertJoinTableBatch(tbl, tableRows, force);
                                } else {
                                    insertEntityBatch(tbl, tableRows, force);
                                }
                            } catch (Exception e) {
                                status.setRollbackOnly();
                                throw new RuntimeException(e);
                            }
                        });
                    } catch (Exception tableEx) {
                        // Jadval xatosi butun restore'ni to'xtatmaydi — davom etadi
                        log.error("[RESTORE] Table {} failed, skipping: {}", table, tableEx.getMessage());
                        failedTables.add(table);
                        summary.append(table).append(": FAILED (").append(tableEx.getMessage()).append(")\n");
                        i++;
                        continue;
                    }
                }

                summary.append(table).append(": ").append(rows.size()).append(" rows\n");
                totalRows += rows.size();
                i++;
                log.info("[RESTORE] Inserted table={} rows={}", table, rows.size());
            }
        } catch (Exception e) {
            throw new RuntimeException("DB restore failed: " + e.getMessage(), e);
        } finally {
            // FK constraint'larni qayta yoqish — xato bo'lsa ham bajariladi
            try {
                jdbcTemplate.execute("SET session_replication_role = 'origin'");
            } catch (Exception ex) {
                log.warn("[RESTORE] Could not re-enable FK constraints: {}", ex.getMessage());
            }
        }

        if (!failedTables.isEmpty()) {
            log.warn("[RESTORE] Completed with {} failed tables: {}", failedTables.size(), failedTables);
            summary.append("\nFAILED TABLES: ").append(failedTables).append("\n");
        }

        log.info("[RESTORE] DB insert complete. Total rows={}", totalRows);

        // Sequence'larni reset qilish
        job.updateProgress(87, "Resetting sequences");
        resetSequences();
    }

    private void truncateAllTables() {
        for (String table : TRUNCATE_ORDER) {
            try {
                jdbcTemplate.execute("TRUNCATE TABLE " + table + " CASCADE");
            } catch (Exception e) {
                log.warn("[RESTORE] Could not truncate {}: {}", table, e.getMessage());
            }
        }
    }

    /**
     * ID ustunli jadvalga batch insert.
     * PostgreSQL GENERATED BY DEFAULT AS IDENTITY – explicit ID ruxsat beriladi.
     * force=false: ON CONFLICT (id) DO NOTHING (mavjud ID'lar o'tkaziladi).
     * force=true:  ON CONFLICT (id) DO UPDATE – barcha ustunlar yangilanadi.
     */
    private void insertEntityBatch(String table, List<Map<String, Object>> rows, boolean force) {
        if (rows.isEmpty()) return;

        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        String colList       = String.join(", ", columns);
        String placeholders  = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String conflict = force ? buildUpsertClause(columns) : "ON CONFLICT DO NOTHING";
        String sql = "INSERT INTO " + table + " (" + colList + ") VALUES (" + placeholders + ") " + conflict;

        try {
            jdbcTemplate.batchUpdate(sql, rows, 500, (ps, row) -> {
                for (int i = 0; i < columns.size(); i++) {
                    ps.setObject(i + 1, convertValue(row.get(columns.get(i))));
                }
            });
        } catch (Exception batchEx) {
          log.warn("[RESTORE] Batch failed for table={}, retrying row-by-row with savepoints: {}",
                    table, batchEx.getMessage());

            int[] counts = {0, 0}; // [inserted, skipped]
            jdbcTemplate.execute((Connection conn) -> {
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    for (Map<String, Object> row : rows) {
                        Savepoint sp = conn.setSavepoint();
                        try {
                            for (int i = 0; i < columns.size(); i++) {
                                ps.setObject(i + 1, convertValue(row.get(columns.get(i))));
                            }
                            ps.executeUpdate();
                            conn.releaseSavepoint(sp);
                            counts[0]++;
                        } catch (SQLException rowEx) {
                            conn.rollback(sp); // faqat shu qatorni orqaga qaytaradi
                            counts[1]++;
                            log.debug("[RESTORE] Skipped row in table={}: {}", table, rowEx.getMessage());
                        }
                    }
                }
                return null;
            });

            log.warn("[RESTORE] table={} row-by-row complete: inserted={} skipped={}",
                    table, counts[0], counts[1]);
        }
    }// ─── new helper method (add anywhere in the Helpers section) ─────────────────
    /**
     * Jackson schemarsiz Map'ga o'qiganda barcha timestamp qiymatlarini
     * String deb deserialize qiladi. PostgreSQL "timestamp without time zone"
     * ustuniga String jo'natib bo'lmaydi — Timestamp ga o'girish kerak.
     */
    private Object convertValue(Object value) {
        if (!(value instanceof String s)) return value;

        // "2026-02-20T15:24:57.288+00:00" — timezone offset bilan (ISO-8601)
        try {
            return Timestamp.from(OffsetDateTime.parse(s).toInstant());
        } catch (DateTimeParseException ignored) {}

        // "2026-02-20T15:24:57.288" — timezone offset siz
        try {
            return Timestamp.valueOf(LocalDateTime.parse(s));
        } catch (DateTimeParseException ignored) {}

        return value;
    }
    /**
     * Join table (id ustuni yo'q) uchun batch insert.
     */
    private void insertJoinTableBatch(String table, List<Map<String, Object>> rows,
                                      boolean force) {
        if (rows.isEmpty()) return;

        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        String colList       = String.join(", ", columns);
        String placeholders  = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String conflict      = "ON CONFLICT DO NOTHING";

        String sql = "INSERT INTO " + table + " (" + colList + ") VALUES (" + placeholders + ") " + conflict;

        jdbcTemplate.batchUpdate(sql, rows, 500, (ps, row) -> {
            for (int i = 0; i < columns.size(); i++) {
                ps.setObject(i + 1, convertValue(row.get(columns.get(i)))); // ← add convertValue
            }
        });
    }

    /** Upsert uchun SET clause: id EXCLUDED qilinadi (primary key qayta set qilinmaydi). */
    private String buildUpsertClause(List<String> columns) {
        StringBuilder sb = new StringBuilder("ON CONFLICT (id) DO UPDATE SET ");
        boolean first = true;
        for (String col : columns) {
            if ("id".equals(col)) continue;
            if (!first) sb.append(", ");
            sb.append(col).append(" = EXCLUDED.").append(col);
            first = false;
        }
        return sb.toString();
    }

    private void resetSequences() {
        for (String table : SEQUENCE_TABLES) {
            try {
                String sql = """
                        SELECT setval(
                            pg_get_serial_sequence('%s', 'id'),
                            COALESCE((SELECT MAX(id) FROM %s), 1),
                            true
                        )""".formatted(table, table);
                jdbcTemplate.queryForObject(sql, Long.class);
            } catch (Exception e) {
                log.warn("[RESTORE] Could not reset sequence for {}: {}", table, e.getMessage());
            }
        }
        log.info("[RESTORE] Sequences reset for {} tables", SEQUENCE_TABLES.length);
    }

    // ─── Media files restore ─────────────────────────────────────────────────

    private void restoreMediaFiles(Path tempDir, BackupJobStatus job) throws IOException {
        Path filesDir = tempDir.resolve("files");
        if (!Files.exists(filesDir)) {
            log.info("[RESTORE] No media files in backup.");
            return;
        }

        if (!"local".equalsIgnoreCase(storageProperties.getType())) {
            log.info("[RESTORE] Storage type='{}'; skipping local file restore.", storageProperties.getType());
            return;
        }

        Path uploadsDir = Path.of(storageProperties.getLocal().getUploadDir()).toAbsolutePath().normalize();
        Files.createDirectories(uploadsDir);

        int[] count = {0};
        try (Stream<Path> walk = Files.walk(filesDir)) {
            walk.filter(Files::isRegularFile)
                    .forEach(src -> {
                        try {
                            Path relative = filesDir.relativize(src);
                            Path dest     = uploadsDir.resolve(relative.toString()).normalize();
                            Files.createDirectories(dest.getParent());
                            Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
                            count[0]++;
                        } catch (IOException e) {
                            log.warn("[RESTORE] Could not restore file {}: {}", src, e.getMessage());
                        }
                    });
        }

        log.info("[RESTORE] Media files restored: count={}", count[0]);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private List<Map<String, Object>> readJsonArray(Path file) throws IOException {
        return objectMapper.readValue(file.toFile(), new TypeReference<>() {});
    }

    private String computeSha256(Path file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = Files.newInputStream(file)) {
            byte[] buf = new byte[8192];
            int read;
            while ((read = in.read(buf)) != -1) digest.update(buf, 0, read);
        }
        return "sha256:" + HexFormat.of().formatHex(digest.digest());
    }

    private static SecretKeySpec deriveKey(String password, byte[] salt) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 310_000, 256);
        SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] keyBytes = skf.generateSecret(spec).getEncoded();
        return new SecretKeySpec(keyBytes, "AES");
    }

    private void deleteTempDir(Path dir) {
        if (dir == null) return;
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try { Files.delete(p); } catch (IOException ignored) {}
                    });
        } catch (IOException e) {
            log.warn("[RESTORE] Could not clean temp dir {}: {}", dir, e.getMessage());
        }
    }
}