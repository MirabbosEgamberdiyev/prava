package uz.pravaimtihon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple topic response for dropdown/select lists
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicSimpleResponse {
    private Long id;
    private String code;
    private String name; // Localized
    private String iconUrl;
}