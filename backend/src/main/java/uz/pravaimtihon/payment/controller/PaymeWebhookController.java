package uz.pravaimtihon.payment.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.payment.dto.payme.JsonRpcRequest;
import uz.pravaimtihon.payment.dto.payme.JsonRpcResponse;
import uz.pravaimtihon.payment.service.PaymeService;

/**
 *  In Payme merchant dashboard (Cashbox settings) set:
 *     Endpoint: https://pravaonline.uz/api/v1/payment/payme
 *
 *  Payme always sends:
 *     Authorization: Basic base64("Paycom:<CASHBOX_KEY>")
 *     Content-Type : application/json
 */
@RestController
@RequestMapping("/api/v1/payment/payme")
@RequiredArgsConstructor
@Slf4j
public class PaymeWebhookController {

    private final PaymeService paymeService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public JsonRpcResponse handle(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth,
            @RequestBody JsonRpcRequest body) {
        return paymeService.handle(auth, body);
    }
}
