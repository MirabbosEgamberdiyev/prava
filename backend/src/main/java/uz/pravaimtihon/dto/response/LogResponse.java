package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogResponse {

    private String logFilePath;
    private long totalLines;
    private long fileSizeBytes;
    private String fileSizeMB;
    private LocalDateTime lastModified;
    private List<String> lines;
    private int fromLine;
    private int toLine;
    private String message;
}
