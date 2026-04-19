package uz.pravaimtihon.payment.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import uz.pravaimtihon.entity.ExamPackage;
import uz.pravaimtihon.payment.dto.AdminPackagePricingResponse;
import uz.pravaimtihon.payment.dto.AdminTogglePackagePaidRequest;
import uz.pravaimtihon.payment.exception.PaymentException;
import uz.pravaimtihon.repository.ExamPackageRepository;

import java.math.BigDecimal;

/**
 * ADMIN-only — switch a package between FREE and PAID.
 *
 *   PATCH /api/v1/admin/packages/{id}/toggle-paid
 *        body: { "paid": true, "price": 50000 }
 *        body: { "paid": false }
 *
 * Security: path is under /api/v1/admin/** — the existing SecurityConfig
 * already restricts that prefix to ADMIN / SUPER_ADMIN. We do NOT modify
 * the existing SecurityConfig. @PreAuthorize is a belt-and-braces guard.
 */
@RestController
@RequestMapping("/api/v1/admin/packages")
@RequiredArgsConstructor
@Slf4j
public class AdminPackagePricingController {

    private final ExamPackageRepository packageRepo;

    @PatchMapping("/{id}/toggle-paid")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Transactional
    public AdminPackagePricingResponse togglePaid(
            @PathVariable Long id,
            @Valid @RequestBody AdminTogglePackagePaidRequest body) {

        ExamPackage pkg = packageRepo.findById(id)
                .orElseThrow(() -> PaymentException.notFound("Package not found: " + id));

        boolean makePaid = Boolean.TRUE.equals(body.getPaid());

        if (makePaid) {
            BigDecimal price = body.getPrice();
            if (price == null || price.signum() <= 0)
                throw PaymentException.badRequest("price must be > 0 when paid=true");
            pkg.setIsFree(false);
            pkg.setPrice(price);
        } else {
            pkg.setIsFree(true);
            // keep previous price for audit; set to 0 is also OK if policy requires
        }

        ExamPackage saved = packageRepo.save(pkg);
        log.info("[admin] toggle-paid packageId={} paid={} price={}", id, !saved.getIsFree(), saved.getPrice());

        return AdminPackagePricingResponse.builder()
                .packageId(saved.getId())
                .nameUzl(saved.getNameUzl())
                .isFree(saved.getIsFree())
                .price(saved.getPrice())
                .build();
    }

    @GetMapping("/{id}/pricing")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public AdminPackagePricingResponse getPricing(@PathVariable Long id) {
        ExamPackage pkg = packageRepo.findById(id)
                .orElseThrow(() -> PaymentException.notFound("Package not found: " + id));
        return AdminPackagePricingResponse.builder()
                .packageId(pkg.getId())
                .nameUzl(pkg.getNameUzl())
                .isFree(pkg.getIsFree())
                .price(pkg.getPrice())
                .build();
    }
}
