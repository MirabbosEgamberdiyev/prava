package uz.pravaimtihon.octagon.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;
import uz.pravaimtihon.octagon.service.OctagonTicketService;

import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class OctagonWebSocketHandler extends TextWebSocketHandler {

    private final OctagonTicketService ticketService;
    private final OctagonMatchmaker matchmaker;
    private final ObjectMapper objectMapper;

    private final Map<String, OctagonSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null) {
            session.close(new CloseStatus(4001, "Missing URI"));
            return;
        }

        String ticket = UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst("ticket");
        if (ticket == null || ticket.isBlank()) {
            log.warn("Rejected Octagon WS connection without ticket from {}", session.getRemoteAddress());
            session.close(new CloseStatus(4001, "One-Time Ticket required (OWASP CWE-598)"));
            return;
        }

        String userId = ticketService.consumeTicketAndGetUserId(ticket);
        if (userId == null) {
            log.warn("Rejected Octagon WS connection with invalid/expired ticket: {}", ticket);
            session.close(new CloseStatus(4001, "Invalid or expired ticket"));
            return;
        }

        String displayName = "Player_" + (userId.length() > 6 ? userId.substring(userId.length() - 4) : userId);
        OctagonSession octSession = new OctagonSession(userId, displayName, session);
        session.getAttributes().put("userId", userId);
        sessionMap.put(session.getId(), octSession);

        matchmaker.registerSession(octSession);
        log.info("Octagon WS connection established for userId={} (session={})", userId, session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        OctagonSession octSession = sessionMap.get(session.getId());
        if (octSession == null) return;

        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String event = root.has("event") ? root.get("event").asText() : (root.has("type") ? root.get("type").asText() : "");
            JsonNode data = root.has("data") ? root.get("data") : root;

            switch (event) {
                case "join_queue":
                    int progress = data.has("userProgress") ? data.get("userProgress").asInt(0) : 0;
                    int elo = data.has("currentElo") ? data.get("currentElo").asInt(0) : 0;
                    matchmaker.joinQueue(octSession, progress, elo);
                    break;

                case "leave_queue":
                    matchmaker.leaveQueue(octSession);
                    break;

                case "submit_answer":
                    UUID matchId = UUID.fromString(data.get("matchId").asText());
                    Long questionId = data.get("questionId").asLong();
                    int selectedIndex = data.get("selectedIndex").asInt();
                    long clientTimestamp = data.has("clientTimestamp") ? data.get("clientTimestamp").asLong() : System.currentTimeMillis();
                    matchmaker.handleSubmitAnswer(octSession, matchId, questionId, selectedIndex, clientTimestamp);
                    break;

                case "send_reaction":
                    UUID rxMatchId = UUID.fromString(data.get("matchId").asText());
                    String emojiId = data.get("emojiId").asText();
                    matchmaker.handleSendReaction(octSession, rxMatchId, emojiId);
                    break;

                case "request_revenge":
                    UUID revMatchId = UUID.fromString(data.get("matchId").asText());
                    matchmaker.handleRequestRevenge(octSession, revMatchId);
                    break;

                case "heartbeat_ping":
                    octSession.setLastPingTime(java.time.Instant.now());
                    String pong = objectMapper.writeValueAsString(Map.of(
                            "event", "heartbeat_ping",
                            "data", Map.of("t", System.currentTimeMillis())
                    ));
                    octSession.send(pong);
                    break;

                default:
                    log.debug("Unknown Octagon WS event: {}", event);
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to process Octagon WS message from {}: {}", octSession.getUserId(), e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        OctagonSession octSession = sessionMap.remove(session.getId());
        if (octSession != null) {
            matchmaker.removeSession(octSession.getUserId());
            log.info("Octagon WS connection closed for userId={} (code={}, reason={})",
                    octSession.getUserId(), status.getCode(), status.getReason());
        }
    }
}
