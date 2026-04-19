package uz.pravaimtihon.payment.dto.payme;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonRpcError {
    private int     code;
    private Object  message;   // Payme expects localized map: {"uz":..,"ru":..,"en":..}
    private String  data;

    public static JsonRpcError of(int code, String en, String ru, String uz, String data) {
        Map<String, String> msg = new HashMap<>();
        msg.put("en", en);
        msg.put("ru", ru);
        msg.put("uz", uz);
        return new JsonRpcError(code, msg, data);
    }

    public static JsonRpcError of(int code, String message, String data) {
        return of(code, message, message, message, data);
    }
}
