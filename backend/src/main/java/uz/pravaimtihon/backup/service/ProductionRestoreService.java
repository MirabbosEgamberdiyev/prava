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
import uz.pravaimtihon.backup.dto.BackupJobStatus.TableImportResult;
import uz.pravaimtihon.backup.dto.BackupManifest;
import uz.pravaimtihon.backup.dto.BackupManifest.EntityInfo;
import uz.pravaimtihon.backup.dto.ClearOptions;
import uz.pravaimtihon.backup.dto.ImportOptions;
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
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;

/**
 * Production-grade restore (import) servisi.
 *
 * <h3>Xavfsizlik kafolatlari:</h3>
 * <ul>
 *   <li>Checksum validation – har bir entity faylidagi SHA-256 manifest bilan taqqoslanadi</li>
 *   <li>Schema compatibility check – manifest versiyasi tekshiriladi</li>
 *   <li>Duplicate-safe – ON CONFLICT DO NOTHING (merge) yoki TRUNCATE CASCADE (force)</li>
 *   <li>Per-table transaction – bitta jadval xatosi butun restore'ni to'xtatmaydi</li>
 *   <li>Savepoint fallback – batch xatoda qator-qatorga tushadi, har bir qator savepoint ichida</li>
 *   <li>Sequence reset – import tugagandan so'ng barcha PostgreSQL sequence'lari yangilanadi</li>
 *   <li>Selective import – ImportOptions orqali faqat kerakli jadvallarni import qilish</li>
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

    private final JdbcTemplate               jdbcTemplate;
    private final ObjectMapper               objectMapper;
    private final StorageProperties          storageProperties;
    private final BackupJobRegistry          jobRegistry;
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
     * @param options      qaysi jadvallarni import qilishni belgilaydi (null = hammasi)
     */
    @Async("backupTaskExecutor")
    public CompletableFuture<Void> startRestore(String jobId,
                                                String zipFilePath,
                                                boolean forceReplace,
                                                String password,
                                                ImportOptions options) {
        BackupJobStatus job = jobRegistry.find(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        ImportOptions effectiveOptions = (options != null) ? options : ImportOptions.all();

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
            Map<String, TableImportResult> results = restoreDatabase(manifest, tempDir, forceReplace, job, effectiveOptions);
            job.setTableResults(results);

            // Summary string (backward compat)
            StringBuilder summary = buildSummaryString(results);
            job.setRestoreSummary(summary.toString());

            if (effectiveOptions.isImportMedia()) {
                job.updateProgress(90, "Restoring media files");
                restoreMediaFiles(tempDir, job);
            } else {
                log.info("[RESTORE] Media import skipped (importMedia=false)");
            }

            job.markCompleted("Restore complete");
            log.info("[RESTORE] Completed: jobId={} duration={}ms", jobId, System.currentTimeMillis() - t0);

        } catch (Exception e) {
            log.error("[RESTORE] Failed: jobId={}", jobId, e);
            job.markFailed(e.getMessage());
        } finally {
            deleteTempDir(tempDir);
            try { Files.deleteIfExists(Path.of(zipFilePath)); } catch (IOException ignored) {}
        }

        return CompletableFuture.completedFuture(null);
    }

    /**
     * Ma'lumotlarni selektiv tozalaydi va natijani qaytaradi.
     * TRUNCATE operatsiyasi — FK constraint'lar vaqtinchalik o'chiriladi.
     *
     * @param options  qaysi jadvallar va media fayllarni tozalash
     * @return tozalangan jadvallar ro'yxati
     */
    public List<String> clearData(ClearOptions options) {
        if (options == null || options.isEmpty()) {
            throw new IllegalArgumentException("ClearOptions bo'sh: hech narsa tanlanmagan");
        }

        List<String> tablesToClear = options.getTablesToClear();
        List<String> clearedTables = new ArrayList<>();
        List<String> failedTables  = new ArrayList<>();

        if (!tablesToClear.isEmpty()) {
            log.info("[CLEAR] Starting selective clear: tables={}", tablesToClear);

            jdbcTemplate.execute("SET session_replication_role = 'replica'");
            try {
                for (String table : tablesToClear) {
                    try {
                        jdbcTemplate.execute("TRUNCATE TABLE " + table);
                        clearedTables.add(table);
                        log.info("[CLEAR] Cleared table={}", table);
                    } catch (Exception e) {
                        failedTables.add(table);
                        log.error("[CLEAR] Failed to clear table={}: {}", table, e.getMessage());
                    }
                }
            } finally {
                try {
                    jdbcTemplate.execute("SET session_replication_role = 'origin'");
                } catch (Exception ex) {
                    log.warn("[CLEAR] Could not re-enable FK constraints: {}", ex.getMessage());
                }
            }

            // Sequence'larni reset qilish
            for (String table : clearedTables) {
                if (Arrays.asList(SEQUENCE_TABLES).contains(table)) {
                    try {
                        String sql = "SELECT setval(pg_get_serial_sequence('%s', 'id'), 1, false)".formatted(table);
                        jdbcTemplate.queryForObject(sql, Long.class);
                    } catch (Exception e) {
                        log.warn("[CLEAR] Could not reset sequence for {}: {}", table, e.getMessage());
                    }
                }
            }
        }

        if (options.isClearMedia()) {
            clearMediaFiles();
        }

        if (!failedTables.isEmpty()) {
            log.warn("[CLEAR] Failed tables: {}", failedTables);
        }

        log.info("[CLEAR] Done: cleared={} failed={}", clearedTables.size(), failedTables.size());
        return clearedTables;
    }

    // ─── ZIP extraction ─────────────────────────────────────────────────────

    private void extractZip(Path zipFile, Path targetDir, String password) throws Exception {
        InputStream raw = Files.newInputStream(zipFile);

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

        for (Map.Entry<String, EntityInfo> entry : manifest.getEntities().entrySet()) {
            String table    = entry.getKey();
            EntityInfo info = entry.getValue();
            Path dataFile   = dir.resolve(info.getZipPath());

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

    private Map<String, TableImportResult> restoreDatabase(BackupManifest manifest, Path dir,
                                                           boolean force, BackupJobStatus job,
                                                           ImportOptions options) {
        Map<String, TableImportResult> results = new LinkedHashMap<>();

        // 1. FORCE rejimi: avval truncate
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

        int totalRows    = 0;
        int entityCount  = manifest.getEntities().size();
        int i            = 0;
        List<String> failedTables = new ArrayList<>();

        try {
            for (Map.Entry<String, EntityInfo> entry : manifest.getEntities().entrySet()) {
                String table    = entry.getKey();
                EntityInfo info = entry.getValue();
                Path dataFile   = dir.resolve(info.getZipPath());

                // Selective import: ushbu jadval o'tkazib yuborilishini tekshirish
                if (!options.isTableEnabled(table)) {
                    log.info("[RESTORE] Skipping table={} (not in ImportOptions)", table);
                    results.put(table, new TableImportResult(table, 0, 0, 0, 0, "skipped by ImportOptions"));
                    i++;
                    continue;
                }

                int pct = 25 + (int) (i * 60.0 / entityCount);
                job.updateProgress(pct, "Inserting " + table);

                List<Map<String, Object>> rows = readJsonArray(dataFile);
                final String     tbl       = table;
                final List<Map<String, Object>> tableRows = rows;
                final EntityInfo tableInfo = info;
                final int[]      counters  = {0, 0, 0}; // [inserted, skipped, failed]

                if (!rows.isEmpty()) {
                    TransactionTemplate tableTx = new TransactionTemplate(txManager);
                    tableTx.setTimeout(-1);
                    try {
                        tableTx.executeWithoutResult(status -> {
                            try {
                                int[] res;
                                if (tableInfo.isJoinTable()) {
                                    res = insertJoinTableBatch(tbl, tableRows);
                                } else {
                                    res = insertEntityBatch(tbl, tableRows, force);
                                }
                                counters[0] = res[0];
                                counters[1] = res[1];
                                counters[2] = res[2];
                            } catch (Exception e) {
                                status.setRollbackOnly();
                                throw new RuntimeException(e);
                            }
                        });
                        results.put(table, new TableImportResult(table, rows.size(),
                                counters[0], counters[1], counters[2], null));
                    } catch (Exception tableEx) {
                        log.error("[RESTORE] Table {} failed: {}", table, tableEx.getMessage());
                        failedTables.add(table);
                        results.put(table, new TableImportResult(table, rows.size(),
                                0, 0, rows.size(), tableEx.getMessage()));
                    }
                } else {
                    results.put(table, new TableImportResult(table, 0, 0, 0, 0, null));
                }

                totalRows += rows.size();
                i++;
                log.info("[RESTORE] Table={} total={} inserted={} skipped={} failed={}",
                        table, rows.size(), counters[0], counters[1], counters[2]);
            }
        } catch (Exception e) {
            throw new RuntimeException("DB restore failed: " + e.getMessage(), e);
        } finally {
            try {
                jdbcTemplate.execute("SET session_replication_role = 'origin'");
            } catch (Exception ex) {
                log.warn("[RESTORE] Could not re-enable FK constraints: {}", ex.getMessage());
            }
        }

        if (!failedTables.isEmpty()) {
            log.warn("[RESTORE] Completed with {} failed tables: {}", failedTables.size(), failedTables);
        }

        log.info("[RESTORE] DB insert complete. Total rows={}", totalRows);

        job.updateProgress(87, "Resetting sequences");
        resetSequences(results);

        return results;
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
     *
     * Returns: int[3] = {inserted, skipped (ON CONFLICT), failed (error)}
     *
     * force=false: ON CONFLICT DO NOTHING — mavjud ID'lar silent skip qilinadi
     * force=true:  ON CONFLICT (id) DO UPDATE — barcha ustunlar yangilanadi
     */
    private int[] insertEntityBatch(String table, List<Map<String, Object>> rows, boolean force) {
        if (rows.isEmpty()) return new int[]{0, 0, 0};

        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        String colList       = String.join(", ", columns);
        String placeholders  = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String conflict      = force ? buildUpsertClause(columns) : "ON CONFLICT DO NOTHING";
        String sql = "INSERT INTO " + table + " (" + colList + ") VALUES (" + placeholders + ") " + conflict;

        try {
            int[][] batchResults = jdbcTemplate.batchUpdate(sql, rows, 500, (ps, row) -> {
                for (int i = 0; i < columns.size(); i++) {
                    ps.setObject(i + 1, convertValue(row.get(columns.get(i))));
                }
            });
            // ON CONFLICT DO NOTHING: inserted rows = 1, skipped rows = 0
            int inserted = 0;
            for (int[] batch : batchResults) {
                for (int count : batch) {
                    if (count > 0) inserted++;
                }
            }
            int skipped = rows.size() - inserted;
            return new int[]{inserted, skipped, 0};

        } catch (Exception batchEx) {
            log.warn("[RESTORE] Batch failed for table={}, retrying row-by-row: {}", table, batchEx.getMessage());
            return insertRowByRow(sql, columns, rows, table);
        }
    }

    /**
     * Join table (id ustuni yo'q) uchun batch insert.
     * Returns: int[3] = {inserted, skipped, failed}
     */
    private int[] insertJoinTableBatch(String table, List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return new int[]{0, 0, 0};

        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        String colList       = String.join(", ", columns);
        String placeholders  = String.join(", ", Collections.nCopies(columns.size(), "?"));
        String sql = "INSERT INTO " + table + " (" + colList + ") VALUES (" + placeholders + ") ON CONFLICT DO NOTHING";

        try {
            int[][] batchResults = jdbcTemplate.batchUpdate(sql, rows, 500, (ps, row) -> {
                for (int i = 0; i < columns.size(); i++) {
                    ps.setObject(i + 1, convertValue(row.get(columns.get(i))));
                }
            });
            int inserted = 0;
            for (int[] batch : batchResults) {
                for (int count : batch) {
                    if (count > 0) inserted++;
                }
            }
            int skipped = rows.size() - inserted;
            return new int[]{inserted, skipped, 0};

        } catch (Exception batchEx) {
            log.warn("[RESTORE] Batch failed for join table={}, retrying row-by-row: {}", table, batchEx.getMessage());
            return insertRowByRow(sql, columns, rows, table);
        }
    }

    /**
     * Batch muvaffaqiyatsiz bo'lganda har bir qatorni savepoint ichida kiritadi.
     * Spring TransactionTemplate tomonidan boshqariladigan connection ichida ishlaydi —
     * autoCommit yoki commit bilan aralashilmaydi, faqat savepoint ishlatiladi.
     *
     * inserted  = muvaffaqiyatli kiritilgan qatorlar
     * skipped   = ON CONFLICT DO NOTHING sababli o'tkazilgan qatorlar (update count = 0)
     * failed    = istalgan boshqa xato (type mismatch, constraint violation va h.k.)
     */
    private int[] insertRowByRow(String sql, List<String> columns,
                                 List<Map<String, Object>> rows, String table) {
        int[] counts = {0, 0, 0}; // [inserted, skipped, failed]

        jdbcTemplate.execute((Connection conn) -> {
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                for (Map<String, Object> row : rows) {
                    Savepoint sp = conn.setSavepoint();
                    try {
                        for (int i = 0; i < columns.size(); i++) {
                            ps.setObject(i + 1, convertValue(row.get(columns.get(i))));
                        }
                        int affected = ps.executeUpdate();
                        conn.releaseSavepoint(sp);
                        if (affected > 0) counts[0]++;  // inserted
                        else              counts[1]++;  // ON CONFLICT skip
                    } catch (SQLException rowEx) {
                        conn.rollback(sp); // faqat shu qatorni orqaga qaytaradi
                        counts[2]++;
                        log.debug("[RESTORE] Row failed in table={}: {}", table, rowEx.getMessage());
                    }
                }
            } catch (SQLException e) {
                throw new RuntimeException("Row-by-row statement prepare failed for table=" + table, e);
            }
            return null;
        });

        log.info("[RESTORE] table={} row-by-row: inserted={} skipped={} failed={}",
                table, counts[0], counts[1], counts[2]);
        return counts;
    }

    /** Upsert uchun SET clause: id EXCLUDED qilinadi. */
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

    /**
     * Jackson schemarsiz Map'ga o'qiganda barcha timestamp qiymatlarini
     * String deb deserialize qiladi. PostgreSQL timestamp ustuniga Timestamp berish kerak.
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
     * Sequence'larni reset qilish — import tugagandan so'ng bajariladi.
     * Har bir jadval uchun MAX(id) asosida sequence yangilanadi.
     * Xato bo'lsa log qilinadi va results'ga yoziladi — import to'xtatilmaydi.
     */
    private void resetSequences(Map<String, TableImportResult> results) {
        int resetOk = 0, resetFailed = 0;
        for (String table : SEQUENCE_TABLES) {
            // Agar jadval import qilinmagan bo'lsa sequence reset kerak emas
            TableImportResult r = results.get(table);
            if (r != null && r.getInserted() == 0 && r.getError() != null) {
                continue;
            }
            try {
                String sql = """
                        SELECT setval(
                            pg_get_serial_sequence('%s', 'id'),
                            COALESCE((SELECT MAX(id) FROM %s), 1),
                            true
                        )""".formatted(table, table);
                jdbcTemplate.queryForObject(sql, Long.class);
                resetOk++;
            } catch (Exception e) {
                resetFailed++;
                log.warn("[RESTORE] Could not reset sequence for {}: {}", table, e.getMessage());
            }
        }
        log.info("[RESTORE] Sequences reset: ok={} failed={}", resetOk, resetFailed);
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
                            if (!dest.startsWith(uploadsDir)) {
                                log.warn("[RESTORE] Skipping suspicious media path: {}", relative);
                                return;
                            }
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

    /**
     * Mahalliy media fayllarni tozalash (ClearOptions.clearMedia uchun).
     */
    private void clearMediaFiles() {
        if (!"local".equalsIgnoreCase(storageProperties.getType())) {
            log.info("[CLEAR] Storage type='{}'; skipping media clear.", storageProperties.getType());
            return;
        }

        Path uploadsDir = Path.of(storageProperties.getLocal().getUploadDir()).toAbsolutePath().normalize();
        if (!Files.exists(uploadsDir)) {
            log.info("[CLEAR] Uploads directory not found: {}", uploadsDir);
            return;
        }

        int[] count = {0};
        try (Stream<Path> walk = Files.walk(uploadsDir)) {
            walk.filter(Files::isRegularFile)
                    .forEach(file -> {
                        try {
                            Files.delete(file);
                            count[0]++;
                        } catch (IOException e) {
                            log.warn("[CLEAR] Could not delete media file {}: {}", file, e.getMessage());
                        }
                    });
        } catch (IOException e) {
            log.warn("[CLEAR] Media clear walk failed: {}", e.getMessage());
        }

        log.info("[CLEAR] Media files deleted: count={}", count[0]);
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

    private StringBuilder buildSummaryString(Map<String, TableImportResult> results) {
        StringBuilder sb = new StringBuilder();
        int totalFailed = 0;
        for (TableImportResult r : results.values()) {
            if (r.getError() != null && !"skipped by ImportOptions".equals(r.getError())) {
                sb.append(r.getTableName()).append(": FAILED (").append(r.getError()).append(")\n");
                totalFailed++;
            } else {
                sb.append(r.getTableName())
                  .append(": inserted=").append(r.getInserted())
                  .append(" skipped=").append(r.getSkipped())
                  .append(" failed=").append(r.getFailed())
                  .append("\n");
            }
        }
        if (totalFailed > 0) {
            sb.append("\nTOTAL FAILED TABLES: ").append(totalFailed).append("\n");
        }
        return sb;
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
