package uz.pravaimtihon.octagon.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class OctagonWebSocketConfig implements WebSocketConfigurer {

    private final OctagonWebSocketHandler octagonWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(octagonWebSocketHandler, "/ws/octagon")
                .setAllowedOriginPatterns("*");
    }
}
