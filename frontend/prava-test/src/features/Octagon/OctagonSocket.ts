import { OCTAGON_CONFIG, type MatchOpponent, type OpponentProgress, type MatchResultData, type GroupRoom, type IncomingChallenge, type OctagonQuestion, type QueueStatus } from "./types";
import { ENV } from "../../config/env";

export interface OctagonSocketCallbacks {
  onConnected?: () => void;
  /** Qidiruv paytida: nechta o'yinchi qidirmoqda / onlayn (radar uchun real ma'lumot). */
  onQueueStatus?: (data: QueueStatus) => void;
  onMatchFound?: (data: { matchId: string; opponent: MatchOpponent; questionIds: number[]; questions?: OctagonQuestion[]; preloadDurationMs: number }) => void;
  onCountdownTick?: (count: number) => void;
  onMatchStarted?: (data: { totalDurationSec: number; startTime: number }) => void;
  onOpponentProgress?: (data: OpponentProgress) => void;
  onOpponentReaction?: (emojiId: string) => void;
  onMatchEnded?: (data: MatchResultData) => void;
  onReconnect?: (data: {
    matchId: string;
    started?: boolean;
    questionIndex: number;
    myAnswers: Record<string, number>;
    myScore?: number;
    opponent?: MatchOpponent;
    opponentProgress?: { answeredCount: number; correctCount: number; questionIndex?: number; totalQuestions?: number; finished?: boolean };
    remainingTimeSec: number;
    questionIds?: number[];
    questions?: OctagonQuestion[];
  }) => void;
  /** Server o'z javobimiz natijasini yuboradi (to'g'ri variant indeksi oshkor qilinmaydi). */
  onAnswerResult?: (data: { questionId: number; isCorrect: boolean; myScore: number; answeredCount: number }) => void;
  /** Jang ochib bo'lmadi (masalan savollar bazasi bo'sh). */
  onMatchError?: (data: { code: string; message: string }) => void;
  onRevengeRequested?: (data: { matchId: string }) => void;
  onError?: (err: Event | Error) => void;
  onClose?: (code: number, reason: string) => void;
  /** All reconnect attempts failed (server unreachable, handshake rejected…) — the UI must leave "searching". */
  onConnectionLost?: () => void;

  // Challenge callbacks
  onChallengeReceived?: (data: IncomingChallenge) => void;
  onChallengeSent?: (data: { challengeId: string; targetUserId: string; targetName?: string; expiresInSec?: number }) => void;
  onChallengeRejected?: (data: { challengeId: string; byUserId?: string }) => void;
  /** Chaqiruvchi bekor qildi yoki 30 s o'tdi — kiruvchi taklif oynasi yopiladi. */
  onChallengeCancelled?: (data: { challengeId: string; reason?: string }) => void;
  /** Server mehmon ulanishini rad etdi (4003) — kirish talab qilinadi. */
  onLoginRequired?: () => void;
  onChallengeError?: (data: { code: string; message: string }) => void;

  // Group Room callbacks
  onRoomCreated?: (room: GroupRoom) => void;
  onRoomJoined?: (room: GroupRoom) => void;
  onRoomUpdated?: (room: GroupRoom) => void;
  onRoomLeft?: (data: { roomCode: string }) => void;
  onRoomError?: (data: { code: string; message: string }) => void;
  onRoomGameCountdown?: (count: number) => void;
  onRoomGameStarted?: (data: { roomCode: string; questionIds: number[]; questions?: OctagonQuestion[]; totalDurationSec: number; startTime: number }) => void;
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
  /** Bir martalik ticket: qayta ulanishda har safar yangisi olinadi (eskisini server rad etadi). */
  private ticketProvider?: () => Promise<string>;

  constructor(callbacks: OctagonSocketCallbacks, ticketProvider?: () => Promise<string>) {
    this.callbacks = callbacks;
    this.ticketProvider = ticketProvider;
  }

  public connect(ticket: string) {
    this.ticket = ticket;
    this.isIntentionallyClosed = false;

    if (this.ws) {
      // Eski socket'ning onclose'i yana reconnect rejalashtirmasin
      const old = this.ws;
      old.onopen = null;
      old.onmessage = null;
      old.onerror = null;
      old.onclose = null;
      try {
        old.close();
      } catch {}
    }

    let wsBaseUrl = "";
    if (typeof window !== "undefined") {
      const isHttps = window.location.protocol === "https:";
      const proto = isHttps ? "wss:" : "ws:";

      // REST bilan bir xil server: ENV.API_BASE_URL (Tauri'da https://pravaonline.uz, dev'da localhost:8081,
      // prod web'da "" = shu origin). Avval mavjud bo'lmagan ENV.API_URL o'qilardi — Desktop'da socket
      // ws://tauri.localhost ga ulanishga urinib, OKTAGON umuman ishlamasdi.
      const apiUrl = (ENV as unknown as { API_BASE_URL?: string })?.API_BASE_URL;
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
        this.flushPending();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const ev = msg.event;
          const data = msg.data || {};

          switch (ev) {
            case "queue_status":
              this.callbacks.onQueueStatus?.({
                searching: Number(data.searching) || 0,
                online: Number(data.online) || 0,
              });
              break;
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
            case "answer_result":
              this.callbacks.onAnswerResult?.(data);
              break;
            case "match_error":
              this.callbacks.onMatchError?.(data);
              break;
            case "revenge_requested":
              this.callbacks.onRevengeRequested?.(data);
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
            case "challenge_cancelled":
              this.callbacks.onChallengeCancelled?.(data);
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

        // 4003 = mehmon (kirish talab qilinadi) — qayta urinishning ma'nosi yo'q
        if (ev.code === 4003) {
          this.isIntentionallyClosed = true;
          this.pending = [];
          this.callbacks.onLoginRequired?.();
          return;
        }
        // 4001 = ticket rad etildi; yangi ticket bilan urinish mantiqiy, eski bilan esa — yo'q
        this.scheduleReconnect();
      };
    } catch (e) {
      this.callbacks.onError?.(e as Error);
    }
  }

  /**
   * Exponential-backoff reconnect with a FRESH one-time ticket. A failed ticket fetch (offline, 429…)
   * counts as a failed attempt and schedules the next one — before, the chain silently stopped there.
   * When the attempts are used up the owner is told (onConnectionLost) instead of spinning forever.
   */
  private scheduleReconnect() {
    if (this.isIntentionallyClosed) return;
    if (this.reconnectAttempts >= OCTAGON_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.giveUp();
      return;
    }
    this.reconnectAttempts++;
    const jitter = Math.random() * OCTAGON_CONFIG.RECONNECT_JITTER_MS;
    const backoff = Math.min(OCTAGON_CONFIG.RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempts - 1), 10000);

    setTimeout(async () => {
      if (this.isIntentionallyClosed) return;
      let fresh: string | undefined;
      try {
        // Ticket bir martalik — eski ticket bilan qayta ulanish har doim 4001 bilan yopilardi
        fresh = this.ticketProvider ? await this.ticketProvider() : this.ticket;
      } catch (e) {
        this.callbacks.onError?.(e as Error);
      }
      if (this.isIntentionallyClosed) return;
      if (fresh) this.connect(fresh);
      else this.scheduleReconnect();
    }, backoff + jitter);
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

  public cancelChallenge(challengeId: string) {
    this.send("cancel_challenge", { challengeId });
  }

  /** Havola/QR/kod orqali do'st jangiga qo'shilish. */
  public joinInvite(inviteCode: string) {
    this.send("join_invite", { inviteCode: inviteCode.trim().toUpperCase() });
  }

  public isOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Internet qaytdi / sahifa yana ko'rindi: backoff kutmasdan darhol yangi ticket bilan ulanadi
   * (server 45 s grace ichida jangni tiklaydi).
   */
  public reconnectNow() {
    if (this.isIntentionallyClosed || this.isOpen()) return;
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return;
    this.reconnectAttempts = 0;
    void (async () => {
      try {
        const fresh = this.ticketProvider ? await this.ticketProvider() : this.ticket;
        if (fresh && !this.isIntentionallyClosed && !this.isOpen()) this.connect(fresh);
      } catch (e) {
        this.callbacks.onError?.(e as Error);
      }
    })();
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
    this.pending = [];
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  /**
   * Messages sent while the socket is still CONNECTING (or reconnecting) are kept and flushed on open.
   * Before, "join_queue" sent right after the lobby (re)connected was silently dropped and the UI kept
   * "searching" without ever being in the queue. Heartbeats are never buffered.
   */
  private pending: string[] = [];
  private static readonly MAX_PENDING = 20;

  private send(event: string, data: Record<string, unknown>) {
    const msg = JSON.stringify({ event, data });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else if (!this.isIntentionallyClosed && event !== "heartbeat_ping" && this.pending.length < OctagonSocket.MAX_PENDING) {
      this.pending.push(msg);
    }
  }

  private flushPending() {
    const queued = this.pending.splice(0);
    for (const msg of queued) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(msg);
    }
  }

  private giveUp() {
    this.pending = [];
    this.callbacks.onConnectionLost?.();
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
