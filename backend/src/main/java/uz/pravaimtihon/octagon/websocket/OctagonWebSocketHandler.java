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

    /** Bitta xabar hajmi chegarasi (eng katta haqiqiy xabar ~200 bayt). */
    static final int MAX_MESSAGE_CHARS = 4096;

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

        OctagonTicketService.TicketData td = ticketService.consumeTicket(ticket);
        if (td == null) {
            // Ticket qiymati logga yozilmaydi
            log.warn("Rejected Octagon WS connection with invalid/expired ticket from {}", session.getRemoteAddress());
            session.close(new CloseStatus(4001, "Invalid or expired ticket"));
            return;
        }

        String userId = td.userId();
        String displayName = td.displayName() != null && !td.displayName().isBlank()
                ? td.displayName()
                : "Player_" + (userId.length() > 6 ? userId.substring(userId.length() - 4) : userId);
        OctagonSession octSession = new OctagonSession(userId, displayName, session);
        session.getAttributes().put("userId", userId);
        sessionMap.put(session.getId(), octSession);

        matchmaker.registerSession(octSession);
        log.info("Octagon WS connection established for userId={} (session={})", userId, session.getId());
    }

    private static UUID uuid(JsonNode data, String field) {
        JsonNode n = data.get(field);
        return n != null && n.isTextual() ? UUID.fromString(n.asText()) : null;
    }

    private static Long longVal(JsonNode data, String field) {
        JsonNode n = data.get(field);
        return n != null && n.canConvertToLong() ? n.asLong() : null;
    }

    private static int intVal(JsonNode data, String field, int def) {
        JsonNode n = data.get(field);
        return n != null && n.canConvertToInt() ? n.asInt() : def;
    }

    private static String text(JsonNode data, String field) {
        JsonNode n = data.get(field);
        return n != null && n.isValueNode() ? n.asText() : null;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        OctagonSession octSession = sessionMap.get(session.getId());
        if (octSession == null) return;
        if (message.getPayloadLength() > MAX_MESSAGE_CHARS) {
            log.warn("Octagon WS message too large from {} ({} chars)", octSession.getUserId(), message.getPayloadLength());
            return;
        }

        try {
            JsonNode root = objectMapper.readTree(message.getPayload());
            String event = root.has("event") ? root.get("event").asText() : (root.has("type") ? root.get("type").asText() : "");
            JsonNode data = root.has("data") && root.get("data").isObject() ? root.get("data") : root;

            switch (event) {
                case "join_queue" ->
                        // currentElo eski klientlar uchun qabul qilinadi, lekin juftlashda serverdagi ELO ishlatiladi
                        matchmaker.joinQueue(octSession, intVal(data, "userProgress", 0), intVal(data, "currentElo", 0));
                case "leave_queue" -> matchmaker.leaveQueue(octSession);
                case "submit_answer" -> {
                    UUID matchId = uuid(data, "matchId");
                    Long questionId = longVal(data, "questionId");
                    if (matchId == null || questionId == null) return;
                    long clientTimestamp = data.has("clientTimestamp") ? data.get("clientTimestamp").asLong() : System.currentTimeMillis();
                    matchmaker.handleSubmitAnswer(octSession, matchId, questionId, intVal(data, "selectedIndex", -1), clientTimestamp);
                }
                case "send_reaction" -> {
                    UUID rxMatchId = uuid(data, "matchId");
                    if (rxMatchId != null) matchmaker.handleSendReaction(octSession, rxMatchId, text(data, "emojiId"));
                }
                case "request_revenge" -> {
                    UUID revMatchId = uuid(data, "matchId");
                    if (revMatchId != null) matchmaker.handleRequestRevenge(octSession, revMatchId);
                }
                case "game_reconnect" -> matchmaker.handleClientReconnectRequest(octSession);

                // Friend Challenge Events
                case "send_challenge" -> {
                    String targetId = text(data, "targetUserId");
                    if (targetId != null && targetId.length() <= 64) matchmaker.handleSendChallenge(octSession, targetId);
                }
                case "accept_challenge" -> {
                    UUID id = uuid(data, "challengeId");
                    if (id != null) matchmaker.handleAcceptChallenge(octSession, id);
                }
                case "reject_challenge" -> {
                    UUID id = uuid(data, "challengeId");
                    if (id != null) matchmaker.handleRejectChallenge(octSession, id);
                }

                // Group Room Events
                case "create_room" -> matchmaker.handleCreateRoom(octSession, intVal(data, "maxPlayers", 4),
                        data.has("isPrivate") && data.get("isPrivate").asBoolean());
                case "join_room" -> matchmaker.handleJoinRoom(octSession, text(data, "roomCode"));
                case "leave_room" -> matchmaker.handleLeaveRoom(octSession);
                case "toggle_ready" -> matchmaker.handleToggleReady(octSession, data.has("isReady") && data.get("isReady").asBoolean());
                case "start_room_game" -> matchmaker.handleStartRoomGame(octSession);
                case "submit_room_answer" -> {
                    Long roomQId = longVal(data, "questionId");
                    if (roomQId == null) return;
                    long roomClientTime = data.has("clientTimestamp") ? data.get("clientTimestamp").asLong() : System.currentTimeMillis();
                    matchmaker.handleSubmitRoomAnswer(octSession, roomQId, intVal(data, "selectedIndex", -1), roomClientTime);
                }

                case "heartbeat_ping" -> {
                    octSession.setLastPingTime(java.time.Instant.now());
                    String pong = objectMapper.writeValueAsString(Map.of(
                            "event", "heartbeat_ping",
                            "data", Map.of("t", System.currentTimeMillis())
                    ));
                    octSession.send(pong);
                }

                default -> log.debug("Unknown Octagon WS event: {}", event);
            }
        } catch (IllegalArgumentException e) {
            log.debug("Malformed Octagon WS payload from {}: {}", octSession.getUserId(), e.getMessage());
        } catch (Exception e) {
            log.warn("Failed to process Octagon WS message from {}: {}", octSession.getUserId(), e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        OctagonSession octSession = sessionMap.remove(session.getId());
        if (octSession != null) {
            matchmaker.removeSession(octSession);
            log.info("Octagon WS connection closed for userId={} (code={}, reason={})",
                    octSession.getUserId(), status.getCode(), status.getReason());
        }
    }
}
