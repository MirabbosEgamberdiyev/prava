package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;

import java.util.*;

/**
 * REST controller for curriculum data (Road signs, markings, exam centers, practical exam, rules, and dynamic stats).
 * High-performance, directly connected to PostgreSQL tables without hardcoded magic numbers.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/curriculum")
@RequiredArgsConstructor
@Tag(name = "Curriculum Data", description = "Public curriculum API for signs, markings, exam centers, practical exam, rules, and system statistics")
public class CurriculumDataController {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 1. GET /api/v1/curriculum/stats
     * Returns dynamic statistics for the system (ZERO hardcoding).
     */
    @GetMapping("/stats")
    @Operation(summary = "Curriculum statistics", description = "Dynamic count of questions, tickets, topics, signs, markings, centers, etc.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurriculumStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            Long totalQuestions = jdbcTemplate.queryForObject("SELECT count(*) FROM questions WHERE deleted = false", Long.class);
            Long totalTickets = jdbcTemplate.queryForObject("SELECT count(*) FROM tickets WHERE deleted = false", Long.class);
            Long totalTopics = jdbcTemplate.queryForObject("SELECT count(*) FROM topics WHERE deleted = false", Long.class);
            Long totalSigns = jdbcTemplate.queryForObject("SELECT count(*) FROM road_signs", Long.class);
            Long totalMarkings = jdbcTemplate.queryForObject("SELECT count(*) FROM road_markings", Long.class);
            Long totalExamCenters = jdbcTemplate.queryForObject("SELECT count(*) FROM exam_centers", Long.class);
            Long totalPracticalExercises = jdbcTemplate.queryForObject("SELECT count(*) FROM practical_exercises", Long.class);
            Long totalPenalties = jdbcTemplate.queryForObject("SELECT count(*) FROM practical_penalties", Long.class);

            stats.put("totalQuestions", totalQuestions != null ? totalQuestions : 0L);
            stats.put("totalTickets", totalTickets != null ? totalTickets : 0L);
            stats.put("totalTopics", totalTopics != null ? totalTopics : 0L);
            stats.put("totalSigns", totalSigns != null ? totalSigns : 0L);
            stats.put("totalMarkings", totalMarkings != null ? totalMarkings : 0L);
            stats.put("totalExamCenters", totalExamCenters != null ? totalExamCenters : 0L);
            stats.put("totalPracticalExercises", totalPracticalExercises != null ? totalPracticalExercises : 0L);
            stats.put("totalPenalties", totalPenalties != null ? totalPenalties : 0L);

            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            log.error("Failed to fetch curriculum stats", e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to load statistics: " + e.getMessage()));
        }
    }

    /**
     * 2. GET /api/v1/curriculum/signs
     * Returns road signs with optional category filter and search query.
     */
    @GetMapping("/signs")
    @Operation(summary = "Road signs", description = "List of official road signs with multi-language titles, descriptions and images")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoadSigns(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        StringBuilder sql = new StringBuilder("SELECT id, code, category, number_in_category, title_uzl, title_uzc, title_ru, description_uzl, description_uzc, description_ru, image_file FROM road_signs WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (category != null && !category.isBlank()) {
            sql.append(" AND LOWER(category) = LOWER(?)");
            params.add(category.trim());
        }

        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(code) LIKE LOWER(?) OR LOWER(title_uzl) LIKE LOWER(?) OR LOWER(title_uzc) LIKE LOWER(?) OR LOWER(title_ru) LIKE LOWER(?))");
            String q = "%" + search.trim() + "%";
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        sql.append(" ORDER BY id ASC");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> r : rows) {
            Map<String, Object> sign = new HashMap<>(r);
            String img = (String) r.get("image_file");
            if (img != null && !img.isBlank()) {
                // filename without path prefix
                String filename = img.contains("/") ? img.substring(img.lastIndexOf('/') + 1) : img;
                sign.put("imageUrl", "/api/v1/files/signs/" + filename);
            } else {
                sign.put("imageUrl", null);
            }
            result.add(sign);
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 3. GET /api/v1/curriculum/markings
     * Returns road markings with optional type filter.
     */
    @GetMapping("/markings")
    @Operation(summary = "Road markings", description = "List of official road markings (horizontal and vertical)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoadMarkings(
            @RequestParam(required = false) String type) {

        StringBuilder sql = new StringBuilder("SELECT id, code, marking_type, title_uzl, title_uzc, title_ru, description_uzl, description_uzc, description_ru, image_file FROM road_markings WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (type != null && !type.isBlank()) {
            sql.append(" AND LOWER(marking_type) LIKE LOWER(?)");
            params.add("%" + type.trim() + "%");
        }

        sql.append(" ORDER BY id ASC");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        List<Map<String, Object>> result = new ArrayList<>();

        for (Map<String, Object> r : rows) {
            Map<String, Object> m = new HashMap<>(r);
            String img = (String) r.get("image_file");
            if (img != null && !img.isBlank()) {
                String filename = img.contains("/") ? img.substring(img.lastIndexOf('/') + 1) : img;
                m.put("imageUrl", "/api/v1/files/markings/" + filename);
            } else {
                m.put("imageUrl", null);
            }
            result.add(m);
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 4. GET /api/v1/curriculum/exam-centers
     * Returns the 14 regional exam centers across Uzbekistan.
     */
    @GetMapping("/exam-centers")
    @Operation(summary = "Regional Exam Centers", description = "List of official unified examination centers across Uzbekistan")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExamCenters() {
        String sql = "SELECT id, region_uzl, region_uzc, region_ru, address_uzl, address_uzc, address_ru, lat, lng, map_url, phones, work_days, work_hours, transport_uzl, transport_uzc, transport_ru, price_theory, price_practical FROM exam_centers ORDER BY id ASC";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    /**
     * 5. GET /api/v1/curriculum/practical-exam
     * Returns practical exercises and practical penalties.
     */
    @GetMapping("/practical-exam")
    @Operation(summary = "Practical exam guide", description = "List of practical exercises on the test track and penalties")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPracticalExam() {
        List<Map<String, Object>> exercises = jdbcTemplate.queryForList(
                "SELECT id, exercise_number, title_uzl, title_uzc, title_ru, description_uzl, description_uzc, description_ru, max_penalty_points, image_url FROM practical_exercises ORDER BY exercise_number ASC");

        List<Map<String, Object>> penalties = jdbcTemplate.queryForList(
                "SELECT id, penalty_number, severity, points, text_uzl, text_uzc, text_ru FROM practical_penalties ORDER BY penalty_number ASC");

        Map<String, Object> data = new HashMap<>();
        data.put("exercises", exercises);
        data.put("penalties", penalties);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * 6. GET /api/v1/curriculum/penalties
     * Returns practical exam penalties and administrative fine rates.
     */
    @GetMapping("/penalties")
    @Operation(summary = "Penalties and Fines", description = "List of penalty point deductions and violations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPenalties() {
        List<Map<String, Object>> penalties = jdbcTemplate.queryForList(
                "SELECT id, penalty_number, severity, points, text_uzl, text_uzc, text_ru FROM practical_penalties ORDER BY penalty_number ASC");
        return ResponseEntity.ok(ApiResponse.success(penalties));
    }

    /**
     * 7. GET /api/v1/curriculum/rules
     * Returns the official traffic rules book.
     */
    @GetMapping("/rules")
    @Operation(summary = "Traffic Rules (YHQ)", description = "Full official Traffic Rules legislation text")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrafficRules() {
        List<Map<String, Object>> rules = jdbcTemplate.queryForList(
                "SELECT id, chapter_num, title_uzl, title_uzc, title_ru, content_html_uzl, content_html_uzc, content_html_ru FROM traffic_rules ORDER BY chapter_num ASC");
        return ResponseEntity.ok(ApiResponse.success(rules));
    }
}
