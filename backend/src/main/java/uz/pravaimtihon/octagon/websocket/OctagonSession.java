package uz.pravaimtihon.octagon.websocket;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import uz.pravaimtihon.octagon.enums.OctagonRank;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class OctagonSession {

    private final String userId;
    private final String displayName;
    private final WebSocketSession session;
    private final Instant connectedAt;

    private int currentElo = 0;
    private OctagonRank rank = OctagonRank.BRONZE;
    private UUID currentMatchId;
    private Instant queuedAt;
    private Instant lastPingTime;
    private Instant disconnectedAt;
    private int reactionCountInWindow = 0;
    private Instant reactionWindowStart = Instant.now();
    private Instant reactionMutedUntil;

    public OctagonSession(String userId, String displayName, WebSocketSession session) {
        this.userId = userId;
        this.displayName = displayName;
        this.session = session;
        this.connectedAt = Instant.now();
        this.lastPingTime = Instant.now();
    }

    public synchronized void send(String payload) {
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(payload));
            } catch (IOException e) {
                // Connection might have dropped
            }
        }
    }

    public boolean isOpen() {
        return session != null && session.isOpen();
    }
}
