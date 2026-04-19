package uz.pravaimtihon.payment.enums;

/**
 * Standard Payme JSON-RPC error codes.
 * Source: https://developer.help.paycom.uz/protokol-merchant-api/
 */
public final class PaymeErrorCode {

    private PaymeErrorCode() {}

    public static final int INVALID_AMOUNT            = -31001;
    public static final int TRANSACTION_NOT_FOUND     = -31003;
    public static final int CANNOT_PERFORM_OPERATION  = -31008;
    public static final int CANNOT_CANCEL_TRANSACTION = -31007;
    public static final int PARSE_ERROR               = -32700;
    public static final int INVALID_REQUEST           = -32600;
    public static final int METHOD_NOT_FOUND          = -32601;
    public static final int INVALID_PARAMS            = -32602;
    public static final int INTERNAL_ERROR            = -32400;
    public static final int UNAUTHORIZED              = -32504;
    public static final int ACCOUNT_NOT_FOUND         = -31050;
    public static final int ORDER_ALREADY_PAID        = -31060;
}
