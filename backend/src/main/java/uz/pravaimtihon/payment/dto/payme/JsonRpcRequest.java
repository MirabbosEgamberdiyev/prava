package uz.pravaimtihon.payment.dto.payme;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic JSON-RPC 2.0 request body sent by Payme.
 *
 * Example: { "method":"CheckPerformTransaction",
 *            "params":{ "amount":500000, "account":{"order_id":"42"} },
 *            "id": 1 }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JsonRpcRequest {
    private String  jsonrpc;
    private Object  id;
    private String  method;
    private JsonNode params;
}
