package uz.pravaimtihon.payment.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.payment.dto.click.ClickCallbackRequest;
import uz.pravaimtihon.payment.dto.click.ClickCallbackResponse;
import uz.pravaimtihon.payment.service.ClickService;

/**
 * Click calls these endpoints form-urlencoded.
 * Security: covered by PaymentSecurityConfig (permitAll) — integrity
 * is enforced by md5 sign verification inside ClickService.
 *
 *   Click dashboard — Merchant settings — URL of Service:
 *      Prepare URL  : https://pravaonline.uz/api/v1/payment/click/prepare
 *      Complete URL : https://pravaonline.uz/api/v1/payment/click/complete
 */
@RestController
@RequestMapping("/api/v1/payment/click")
@RequiredArgsConstructor
@Slf4j
public class ClickWebhookController {

    private final ClickService clickService;

    @PostMapping(value = "/prepare",
            consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.APPLICATION_JSON_VALUE},
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ClickCallbackResponse prepare(ClickCallbackRequest form,
                                         @RequestBody(required = false) ClickCallbackRequest json) {
        return clickService.prepare(pick(form, json));
    }

    @PostMapping(value = "/complete",
            consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.APPLICATION_JSON_VALUE},
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ClickCallbackResponse complete(ClickCallbackRequest form,
                                          @RequestBody(required = false) ClickCallbackRequest json) {
        return clickService.complete(pick(form, json));
    }

    private static ClickCallbackRequest pick(ClickCallbackRequest form, ClickCallbackRequest json) {
        if (json != null && json.getClickTransId() != null) return json;
        return form;
    }
}
