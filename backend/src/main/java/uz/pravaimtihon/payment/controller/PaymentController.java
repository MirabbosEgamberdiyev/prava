package uz.pravaimtihon.payment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.payment.dto.CreateInvoiceRequest;
import uz.pravaimtihon.payment.dto.InvoiceResponse;
import uz.pravaimtihon.payment.dto.PaymentStatusResponse;
import uz.pravaimtihon.payment.exception.PaymentException;
import uz.pravaimtihon.payment.service.ClickService;
import uz.pravaimtihon.payment.service.PaymentService;
import uz.pravaimtihon.payment.service.PaymeService;
import uz.pravaimtihon.security.SecurityUtils;

/**
 * User-facing payment endpoints. Require JWT (handled by the default
 * SecurityFilterChain — anyRequest().authenticated()).
 */
@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final ClickService   clickService;
    private final PaymeService   paymeService;
    private final PaymentService paymentService;

    @PostMapping("/click/invoice")
    @PreAuthorize("isAuthenticated()")
    public InvoiceResponse createClickInvoice(@Valid @RequestBody CreateInvoiceRequest req) {
        User u = currentUser();
        ExamPackage pkg = paymentService.requirePackage(req.getPackageId());
        return clickService.createInvoice(u, pkg);
    }

    @PostMapping("/payme/invoice")
    @PreAuthorize("isAuthenticated()")
    public InvoiceResponse createPaymeInvoice(@Valid @RequestBody CreateInvoiceRequest req) {
        User u = currentUser();
        ExamPackage pkg = paymentService.requirePackage(req.getPackageId());
        return paymeService.createCheckoutUrl(u, pkg);
    }

    @GetMapping("/{paymentId}/status")
    @PreAuthorize("isAuthenticated()")
    public PaymentStatusResponse status(@PathVariable Long paymentId) {
        Long uid = SecurityUtils.getCurrentUserId();
        if (uid == null) throw PaymentException.forbidden("Unauthenticated");
        return paymentService.status(paymentId, uid);
    }

    /* ---------------------------------------------------------- */

    private User currentUser() {
        Long id = SecurityUtils.getCurrentUserId();
        if (id == null) throw PaymentException.forbidden("Unauthenticated");
        return paymentService.requireUser(id);
    }
}
