import { OCTAGON_CONFIG, type MatchOpponent, type OpponentProgress, type MatchResultData, type GroupRoom, type IncomingChallenge } from "./types";
import { ENV } from "../../config/env";

export interface OctagonSocketCallbacks {
  onConnected?: () => void;
  onMatchFound?: (data: { matchId: string; opponent: MatchOpponent; questionIds: number[]; preloadDurationMs: number }) => void;
  onCountdownTick?: (count: number) => void;
  onMatchStarted?: (data: { totalDurationSec: number; startTime: number }) => void;
  onOpponentProgress?: (data: OpponentProgress) => void;
  onOpponentReaction?: (emojiId: string) => void;
  onMatchEnded?: (data: MatchResultData) => void;
  onReconnect?: (data: { matchId: string; questionIndex: number; myAnswers: Record<string, number>; remainingTimeSec: number }) => void;
  onError?: (err: Event | Error) => void;
  onClose?: (code: number, reason: string) => void;

  // Challenge callbacks
  onChallengeReceived?: (data: IncomingChallenge) => void;
  onChallengeSent?: (data: { challengeId: string; targetUserId: string }) => void;
  onChallengeRejected?: (data: { challengeId: string; byUserId?: string }) => void;
  onChallengeError?: (data: { code: string; message: string }) => void;

  // Group Room callbacks
  onRoomCreated?: (room: GroupRoom) => void;
  onRoomJoined?: (room: GroupRoom) => void;
  onRoomUpdated?: (room: GroupRoom) => void;
  onRoomLeft?: (data: { roomCode: string }) => void;
  onRoomError?: (data: { code: string; message: string }) => void;
  onRoomGameCountdown?: (count: number) => void;
  onRoomGameStarted?: (data: { roomCode: string; questionIds: number[]; totalDurationSec: number; startTime: number }) => void;
  onGroupProgress?: (data: { userId: string; displayName: string; questionIndex: number; answeredCount: number; score: number }) => void;
  onGroupMatchEnded?: (data: { roomCode: string; standings: Array<{ userId: string; displayName: string; avatarUrl: string; score: number; answeredCount: number }> }) => void;
}

export class OctagonSocket {
  private ws: WebSocket | null = null;
  private callbacks: OctagonSocketCallbacks = {};
  private pingTimer: number | null = null;
  private ticket: string = "";
  private isIntentionallyClosed: boolean = false;
  private reconnectAttempts: number = 0;

  constructor(callbacks: OctagonSocketCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(ticket: string) {
    this.ticket = ticket;
    this.isIntentionallyClosed = false;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    let wsBaseUrl = "";
    if (typeof window !== "undefined") {
      const isHttps = window.location.protocol === "https:";
      const proto = isHttps ? "wss:" : "ws:";

      // If ENV.API_URL is configured (e.g. http://localhost:8080 or https://api.pravaonline.uz)
      const apiUrl = (ENV as unknown as { API_URL?: string })?.API_URL;
      if (apiUrl && (apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
        const u = new URL(apiUrl);
        wsBaseUrl = `${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}`;
      } else {
        wsBaseUrl = `${proto}//${window.location.host}`;
      }
    }

    const fullUrl = `${wsBaseUrl}/ws/octagon?ticket=${encodeURIComponent(ticket)}`;

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const ev = msg.event;
          const data = msg.data || {};

          switch (ev) {
            case "match_found":
              this.callbacks.onMatchFound?.(data);
              break;
            case "countdown_tick":
              this.callbacks.onCountdownTick?.(data.count);
              break;
            case "match_started":
              this.callbacks.onMatchStarted?.(data);
              break;
            case "opponent_progress":
              this.callbacks.onOpponentProgress?.(data);
              break;
            case "opponent_reaction":
              this.callbacks.onOpponentReaction?.(data.emojiId);
              break;
            case "match_ended":
              this.callbacks.onMatchEnded?.(data);
              break;
            case "game_reconnect":
              this.callbacks.onReconnect?.(data);
              break;
            case "heartbeat_ping":
              // Server acknowledged ping
              break;

            // Direct Challenge events
            case "challenge_received":
              this.callbacks.onChallengeReceived?.(data as IncomingChallenge);
              break;
            case "challenge_sent":
              this.callbacks.onChallengeSent?.(data);
              break;
            case "challenge_rejected":
              this.callbacks.onChallengeRejected?.(data);
              break;
            case "challenge_error":
              this.callbacks.onChallengeError?.(data);
              break;

            // Group Room events
            case "room_created":
              this.callbacks.onRoomCreated?.(data.room as GroupRoom);
              break;
            case "room_joined":
              this.callbacks.onRoomJoined?.(data.room as GroupRoom);
              break;
            case "room_updated":
              this.callbacks.onRoomUpdated?.(data.room as GroupRoom);
              break;
            case "room_left":
              this.callbacks.onRoomLeft?.(data);
              break;
            case "room_error":
              this.callbacks.onRoomError?.(data);
              break;
            case "room_game_countdown":
              this.callbacks.onRoomGameCountdown?.(data.count);
              break;
            case "room_game_started":
              this.callbacks.onRoomGameStarted?.(data);
              break;
            case "group_progress":
              this.callbacks.onGroupProgress?.(data);
              break;
            case "group_match_ended":
              this.callbacks.onGroupMatchEnded?.(data);
              break;

            default:
              break;
          }
        } catch {
          // Non-JSON message
        }
      };

      this.ws.onerror = (err) => {
        this.callbacks.onError?.(err);
      };

      this.ws.onclose = (ev) => {
        this.stopHeartbeat();
        this.callbacks.onClose?.(ev.code, ev.reason);

        // Attempt reconnect if not intentionally closed and under limit
        if (!this.isIntentionallyClosed && this.reconnectAttempts < OCTAGON_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          const jitter = Math.random() * OCTAGON_CONFIG.RECONNECT_JITTER_MS;
          const delay = OCTAGON_CONFIG.RECONNECT_BASE_DELAY_MS + jitter;

          setTimeout(() => {
            if (!this.isIntentionallyClosed && this.ticket) {
              this.connect(this.ticket);
            }
          }, delay);
        }
      };
    } catch (e) {
      this.callbacks.onError?.(e as Error);
    }
  }

  public joinQueue(userProgress: number, currentElo: number) {
    this.send("join_queue", { userProgress, currentElo });
  }

  public leaveQueue() {
    this.send("leave_queue", {});
  }

  public submitAnswer(matchId: string, questionId: number, selectedIndex: number) {
    this.send("submit_answer", {
      matchId,
      questionId,
      selectedIndex,
      clientTimestamp: Date.now(),
    });
  }

  public sendReaction(matchId: string, emojiId: string) {
    this.send("send_reaction", { matchId, emojiId });
  }

  public requestRevenge(matchId: string) {
    this.send("request_revenge", { matchId });
  }

  // Friend Duel methods
  public sendChallenge(targetUserId: string) {
    this.send("send_challenge", { targetUserId });
  }

  public acceptChallenge(challengeId: string) {
    this.send("accept_challenge", { challengeId });
  }

  public rejectChallenge(challengeId: string) {
    this.send("reject_challenge", { challengeId });
  }

  // Group Room methods
  public createRoom(maxPlayers = 4, isPrivate = false) {
    this.send("create_room", { maxPlayers, isPrivate });
  }

  public joinRoom(roomCode: string) {
    this.send("join_room", { roomCode: roomCode.trim().toUpperCase() });
  }

  public leaveRoom() {
    this.send("leave_room", {});
  }

  public toggleReady(isReady: boolean) {
    this.send("toggle_ready", { isReady });
  }

  public startRoomGame() {
    this.send("start_room_game", {});
  }

  public submitRoomAnswer(questionId: number, selectedIndex: number) {
    this.send("submit_room_answer", {
      questionId,
      selectedIndex,
      clientTimestamp: Date.now(),
    });
  }

  public close() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  private send(event: string, data: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      this.send("heartbeat_ping", { t: Date.now() });
    }, OCTAGON_CONFIG.WS_HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
