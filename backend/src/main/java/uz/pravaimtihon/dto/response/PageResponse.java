package uz.pravaimtihon.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {
    private List<T> content;

    /** Serialized as "number" to match Spring's default Page JSON and frontend types. */
    @JsonProperty("number")
    private Integer page;

    private Integer size;
    private Long    totalElements;
    private Integer totalPages;
    private Boolean first;
    private Boolean last;
    private Boolean empty;
}
