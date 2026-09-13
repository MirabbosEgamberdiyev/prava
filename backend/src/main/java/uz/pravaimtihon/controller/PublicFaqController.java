package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.entity.FaqItem;
import uz.pravaimtihon.service.FaqService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/faqs")
@RequiredArgsConstructor
@Tag(name = "Public FAQ", description = "Ommaviy FAQ savol-javoblar")
public class PublicFaqController {

    private final FaqService faqService;

    @GetMapping
    @Operation(summary = "Faol FAQ savol-javoblar ro'yxati")
    public ResponseEntity<ApiResponse<List<FaqItem>>> getPublicFaqs(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(ApiResponse.success(faqService.getPublicFaqs(category)));
    }
}
