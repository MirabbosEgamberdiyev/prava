package uz.pravaimtihon.octagon.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.Arrays;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class OctagonWebSocketConfig implements WebSocketConfigurer {

    private final OctagonWebSocketHandler octagonWebSocketHandler;

    /**
     * REST CORS bilan bir xil ro'yxat (web, admin, Tauri desktop, localhost). Origin sarlavhasi bo'lmagan
     * native klientlarga (Android/iOS) Spring baribir ruxsat beradi; React Native esa API host'ini
     * (https://pravaonline.uz) Origin sifatida yuboradi — u ro'yxatda bor.
     */
    @Value("${app.security.allowed-origins:https://pravaonline.uz,https://www.pravaonline.uz,https://web.pravaonline.uz,http://tauri.localhost,tauri://localhost,http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = uz.pravaimtihon.security.SecurityConfig.expandLoopbackAliases(
                        Arrays.stream(allowedOrigins.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty() && !"*".equals(s))
                                .toList())
                .toArray(String[]::new);
        registry.addHandler(octagonWebSocketHandler, "/ws/octagon")
                .setAllowedOrigins(origins);
    }
}
