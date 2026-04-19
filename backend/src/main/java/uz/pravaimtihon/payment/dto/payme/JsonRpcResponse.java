package uz.pravaimtihon.payment.dto.payme;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonRpcResponse {
    private String  jsonrpc = "2.0";
    private Object  id;
    private Object  result;
    private JsonRpcError error;

    public static JsonRpcResponse ok(Object id, Object result) {
        JsonRpcResponse r = new JsonRpcResponse();
        r.id = id;
        r.result = result;
        return r;
    }

    public static JsonRpcResponse err(Object id, JsonRpcError error) {
        JsonRpcResponse r = new JsonRpcResponse();
        r.id = id;
        r.error = error;
        return r;
    }
}
