package uz.pravaimtihon.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.dto.request.ContactInquiryRequest;
import uz.pravaimtihon.dto.response.ApiResponse;
import uz.pravaimtihon.dto.response.ContactInquiryResponse;
import uz.pravaimtihon.service.ContactInquiryService;

@RestController
@RequestMapping("/api/v1/public/contact")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public Contact", description = "Ommaviy aloqa va hamkorlik so'rovlari")
public class PublicContactController {

    private final ContactInquiryService inquiryService;

    @PostMapping("/inquiry")
    @Operation(summary = "Hamkorlik yoki aloqa so'rovini yuborish")
    public ResponseEntity<ApiResponse<ContactInquiryResponse>> submitInquiry(
            @Valid @RequestBody ContactInquiryRequest request,
            HttpServletRequest httpServletRequest) {

        String clientIp = extractClientIp(httpServletRequest);
        log.info("Public contact inquiry received");

        ContactInquiryResponse response = inquiryService.processInquiry(request, clientIp);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        return uz.pravaimtihon.security.ClientIpResolver.resolve(request);
    }
}
