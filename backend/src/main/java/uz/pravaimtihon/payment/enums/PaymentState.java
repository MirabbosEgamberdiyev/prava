package uz.pravaimtihon.payment.enums;

/**
 * Internal payment state — maps to both Click and Payme semantics.
 *
 *  Payme state values:
 *    1   = CREATED  (CreateTransaction called, not yet performed)
 *    2   = PERFORMED (PerformTransaction done — money received)
 *   -1   = CANCELLED before perform
 *   -2   = CANCELLED after perform (refunded)
 */
public enum PaymentState {
    PENDING,      // created but provider not yet confirmed
    CREATED,      // Payme: CreateTransaction OK (state=1)
    PERFORMED,    // completed successfully (state=2)
    CANCELLED,    // cancelled (state=-1)
    REFUNDED,     // cancelled after perform (state=-2)
    FAILED        // generic failure
}
