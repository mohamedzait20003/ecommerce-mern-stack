package com.minglemart.modules.payment.gateway;

/**
 * A provider said no.
 *
 * <p>{@code code} is the provider's own reason — {@code card_declined},
 * {@code insufficient_funds} — kept because it is the difference between a
 * failure worth telling the shopper about and one worth telling an engineer
 * about. It is stored on {@code payments.failure_code} verbatim.
 */
public class PaymentException extends RuntimeException {

    private final String code;

    public PaymentException(String message, String code, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
