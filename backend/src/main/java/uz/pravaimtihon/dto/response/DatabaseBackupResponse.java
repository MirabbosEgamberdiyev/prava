package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Database backup response - barcha ma'lumotlarni JSON formatda export qilish
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DatabaseBackupResponse {

    private LocalDateTime backupDate;
    private String backupVersion;
    private BackupStatistics statistics;

    private List<Map<String, Object>> users;
    private List<Map<String, Object>> topics;
    private List<Map<String, Object>> questions;
    private List<Map<String, Object>> questionOptions;
    private List<Map<String, Object>> examPackages;
    private List<Map<String, Object>> packageQuestionIds;
    private List<Map<String, Object>> tickets;
    private List<Map<String, Object>> ticketQuestionIds;
    private List<Map<String, Object>> examSessions;
    private List<Map<String, Object>> examAnswers;
    private List<Map<String, Object>> userStatistics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BackupStatistics {
        private long userCount;
        private long topicCount;
        private long questionCount;
        private long questionOptionCount;
        private long examPackageCount;
        private long ticketCount;
        private long examSessionCount;
        private long examAnswerCount;
        private long userStatisticsCount;
        private long totalRecords;
    }
}
