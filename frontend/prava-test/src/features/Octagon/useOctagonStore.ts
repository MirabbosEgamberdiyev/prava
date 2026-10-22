import { useState, useEffect, useRef, useCallback } from "react";
import {
  OCTAGON_CONFIG,
  type OctagonState,
  type MatchOpponent,
  type OctagonQuestion,
  type OpponentProgress,
  type MatchResultData,
  type UserStats,
  type FlyingEmoji,
  type GroupRoom,
  type GroupStanding,
  type IncomingChallenge,
  type OutgoingChallenge,
  type UserSearchResult,
  type InviteJoinState,
  type QueueStatus,
  type RematchState,
} from "./types";
import { OctagonApi } from "./OctagonApi";
import { OctagonSocket } from "./OctagonSocket";
import { OctagonAudio } from "./OctagonAudio";
import { imagePreloader } from "./OctagonImagePreloader";
import { fireConfetti } from "./confetti";
import { buildMyTrack, buildOppTrack, createFloodGate, nextOppResults } from "./arena";
import { showToast } from "../../utils/notificationUtils";
import i18n from "../../utils/i18n";

const REACTION_EMOJI: Record<string, string> = {
  fire: "🔥",
  thumbs_up: "👍",
  mindblown: "🤯",
  laugh: "😂",
};

function clearTimer(ref: { current: number | null }) {
  if (ref.current) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

const LIVE_MATCH_STATES: OctagonState[] = ["MATCH_FOUND", "COUNTDOWN", "PLAYING", "RECONNECTING"];
const EMPTY_PROGRESS: OpponentProgress = { questionIndex: 0, answeredCount: 0, correctCount: 0 };
const GRACE_SEC = OCTAGON_CONFIG.RECONNECT_GRACE_PERIOD_SEC;

const reactionGate = () =>
  createFloodGate(OCTAGON_CONFIG.REACTION_FLOOD_LIMIT, OCTAGON_CONFIG.REACTION_COOLDOWN_MS, OCTAGON_CONFIG.REACTION_MUTE_MS);

/**
 * Oktagon holati. 2026-10-21 dan Oktagon FAQAT ro'yxatdan o'tgan foydalanuvchilar uchun: mehmon
 * har qanday jang tugmasini bosganda kirish oynasi ochiladi (`showAuthGate`), socket faqat
 * tizimga kirgan foydalanuvchi uchun ochiladi.
 */
export function useOctagonStore(user: { id?: number | string; firstName?: string } | null) {
  const [state, setState] = useState<OctagonState>("IDLE");
  const [myStats, setMyStats] = useState<UserStats | null>(null);

  const [searchSeconds, setSearchSeconds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [remainingTimeSec, setRemainingTimeSec] = useState(300);

  const [matchId, setMatchId] = useState<string>("");
  const [opponent, setOpponent] = useState<MatchOpponent | null>(null);
  const [questions, setQuestions] = useState<OctagonQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState<Record<number, number>>({});
  const [myScore, setMyScore] = useState(0);
  const [oppProgress, setOppProgress] = useState<OpponentProgress>(EMPTY_PROGRESS);
  const [matchResult, setMatchResult] = useState<MatchResultData | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  /** Revansh: kutilmoqda / raqib taklif qildi / imkonsiz / javobsiz. */
  const [rematch, setRematch] = useState<RematchState>({ status: "idle" });
  const [reconnecting, setReconnecting] = useState(false);
  /** Uzilish boshlangan vaqt — 45 s grace hisoblagichi ("qolgan vaqt: 38s"). */
  const [reconnectSince, setReconnectSince] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  /** Radar: server yuboradigan real navbat holati (nechta o'yinchi qidirmoqda / onlayn). */
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  /** Server answer_result: savol id → to'g'ri/xato (trek yashil/qizil to'ladi). */
  const [myResults, setMyResults] = useState<Record<number, boolean>>({});
  /** Raqib javoblari tartib bo'yicha: to'g'ri/xato yoki null (noma'lum). */
  const [oppResults, setOppResults] = useState<Array<boolean | null>>([]);
  const [reactionsMuted, setReactionsMuted] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const [currentRoom, setCurrentRoom] = useState<GroupRoom | null>(null);
  const [roomErrorMessage, setRoomErrorMessage] = useState<string | null>(null);
  const [roomStandings, setRoomStandings] = useState<GroupStanding[] | null>(null);

  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<OutgoingChallenge | null>(null);
  /** 4 xonali kod bilan qo'shilish holati — duel oynasida xato shu yerda ko'rinadi (oyna yopilmaydi). */
  const [inviteJoin, setInviteJoin] = useState<InviteJoinState>({ status: "idle" });

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const socketRef = useRef<OctagonSocket | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const searchIntervalRef = useRef<number | null>(null);
  const outgoingTimeoutRef = useRef<number | null>(null);
  const stateRef = useRef<OctagonState>(state);
  const outgoingRef = useRef<OutgoingChallenge | null>(null);
  const incomingRef = useRef<IncomingChallenge | null>(null);
  const inviteJoinTimeoutRef = useRef<number | null>(null);
  const inviteJoinPendingRef = useRef(false);
  const showDuelModalRef = useRef(false);
  const linkDownRef = useRef(false);
  const oppProgressRef = useRef<OpponentProgress>(EMPTY_PROGRESS);
  const questionShownAtRef = useRef(0);
  const myFloodRef = useRef(reactionGate());
  const oppFloodRef = useRef(reactionGate());
  const muteTimerRef = useRef<number | null>(null);
  const rematchTimerRef = useRef<number | null>(null);
  /** Qidiruv bekor qilingan vaqt — undan keyin kelgan eskirgan navbat jangi e'tiborsiz qoldiriladi. */
  const searchCancelledAtRef = useRef(0);

  const resetRematch = useCallback(() => {
    clearTimer(rematchTimerRef);
    setRematch({ status: "idle" });
  }, []);

  /** Tarmoq holati: uzildi (45 s hisoblagich boshlanadi) yoki tiklandi. */
  const setLinkDown = useCallback((down: boolean) => {
    linkDownRef.current = down;
    setReconnecting(down);
    setReconnectSince((prev) => (down ? prev ?? Date.now() : null));
  }, []);

  useEffect(() => {
    showDuelModalRef.current = showDuelModal;
  }, [showDuelModal]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    outgoingRef.current = outgoingChallenge;
  }, [outgoingChallenge]);
  useEffect(() => {
    incomingRef.current = incomingChallenge;
  }, [incomingChallenge]);

  const isAuthed = Boolean(user && user.id != null);

  /** Mehmon bo'lsa kirish oynasini ochadi va false qaytaradi. */
  const requireAuth = useCallback((): boolean => {
    if (isAuthed) return true;
    setShowAuthGate(true);
    return false;
  }, [isAuthed]);

  const refreshStats = useCallback(async () => {
    if (!user || user.id == null) {
      setMyStats(null);
      return;
    }
    try {
      const stats = await OctagonApi.getStats(String(user.id));
      if (stats) setMyStats(stats);
    } catch {
      // tarmoq yo'q — oxirgi ma'lum statistika qoladi
    } finally {
      setStatsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      clearTimer(outgoingTimeoutRef);
      clearTimer(inviteJoinTimeoutRef);
      clearTimer(muteTimerRef);
      clearTimer(rematchTimerRef);
      imagePreloader.clear();
    };
  }, []);

  // 45 s grace: banner soniyalarni sanaydi; shu vaqtda ulanib bo'lmasa — "Aloqa uzildi" ekrani
  useEffect(() => {
    if (reconnectSince === null) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      if (now - reconnectSince < GRACE_SEC * 1000) return;
      window.clearInterval(id);
      if (!LIVE_MATCH_STATES.includes(stateRef.current)) return;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setLinkDown(false);
      setState("DISCONNECTED");
    }, 1000);
    return () => window.clearInterval(id);
  }, [reconnectSince, setLinkDown]);
  const reconnectLeftSec =
    reconnectSince === null
      ? null
      : Math.max(0, Math.min(GRACE_SEC, GRACE_SEC - Math.floor((clockNow - reconnectSince) / 1000)));

  const addFlyingEmoji = useCallback((emoji: string, isMine: boolean) => {
    OctagonAudio.playReaction();
    const id = Math.random().toString(36).substring(2, 9);
    const newEmoji: FlyingEmoji = {
      id,
      emoji,
      isMine,
      startX: isMine ? window.innerWidth * 0.25 : window.innerWidth * 0.75,
      startY: window.innerHeight * 0.7,
    };
    setFlyingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => {
      setFlyingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, OCTAGON_CONFIG.REACTION_FLIGHT_MS);
  }, []);

  const startMatchClock = useCallback((seconds: number) => {
    setRemainingTimeSec(seconds);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setRemainingTimeSec((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const createSocket = useCallback(async (): Promise<OctagonSocket> => {
    if (socketRef.current) return socketRef.current;
    if (!user || user.id == null) throw new Error("login required");

    // Ticket bir martalik: birinchi ulanishda ham, har bir qayta ulanishda ham yangisi olinadi.
    const fetchTicket = async (): Promise<string> => (await OctagonApi.getTicket()).ticket;

    const ticket = await fetchTicket();
    if (!ticket) throw new Error("Failed to obtain One-Time Ticket");

    const loadQuestions = async (ids: number[], embedded?: OctagonQuestion[]) => {
      // Server savollarni event ichida yuboradi; eski server bo'lsa REST'dan olinadi
      const qList = embedded && embedded.length > 0 ? embedded : await OctagonApi.getQuestions(ids);
      setQuestions(qList);
      // 8 soniyalik preload oynasida barcha rasmlar parallel yuklanadi (xotiradan 0 ms chiziladi)
      void imagePreloader.preloadImages(qList.map((q) => q.imageUrl || q.image));
    };

    const socket = new OctagonSocket(
      {
        onConnected: () => {
          const wasDown = linkDownRef.current;
          setLinkDown(false);
          // Qidiruv paytida uzilgan bo'lsak — navbatga qayta yozilamiz (server eski sessiyani almashtiradi)
          if (wasDown && stateRef.current === "SEARCHING") socketRef.current?.joinQueue(0, 0);
        },

        onClose: () => {
          if (LIVE_MATCH_STATES.includes(stateRef.current) || stateRef.current === "SEARCHING") setLinkDown(true);
        },

        onQueueStatus: (data) => {
          setQueueStatus(data);
        },

        onMatchFound: async (data) => {
          // Qidiruv bekor qilingandan keyin kelgan navbat jangi (server bekor qilish poygasida uni o'zi bekor
          // qiladi) — lobbidan tasodifan jangga o'tib ketmaymiz; bekor qilishni yana yuboramiz
          const queueMatch = data.gameType === "RANKED_QUEUE" || data.gameType === "BOT_TRAINING";
          if (
            queueMatch &&
            stateRef.current === "IDLE" &&
            Date.now() - searchCancelledAtRef.current < OCTAGON_CONFIG.STALE_MATCH_IGNORE_MS
          ) {
            socketRef.current?.leaveQueue();
            return;
          }
          resetRematch();
          clearTimer(outgoingTimeoutRef);
          clearTimer(inviteJoinTimeoutRef);
          inviteJoinPendingRef.current = false;
          setInviteJoin({ status: "idle" });
          setOutgoingChallenge(null);
          setShowDuelModal(false);
          setShowGroupModal(false);
          setIncomingChallenge(null);
          setMatchId(data.matchId);
          setOpponent(data.opponent);
          oppProgressRef.current = EMPTY_PROGRESS;
          setOppProgress(EMPTY_PROGRESS);
          setOppResults([]);
          setMyResults({});
          setQueueStatus(null);
          myFloodRef.current.reset();
          oppFloodRef.current.reset();
          setMatchResult(null);
          setRoomStandings(null);
          setState("MATCH_FOUND");
          OctagonAudio.playMatchFound();
          if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
          try {
            await loadQuestions(data.questionIds, data.questions);
          } catch {
            // REST zaxira ham ishlamadi — game_reconnect/qayta ulanishda tiklanadi
          }
        },

        onMatchCancelled: (data) => {
          if (stateRef.current !== "MATCH_FOUND" && stateRef.current !== "COUNTDOWN") return;
          imagePreloader.clear();
          setOpponent(null);
          setQuestions([]);
          setMatchId("");
          if (data.requeued) {
            // Raqib qidiruvni bekor qildi — server bizni navbatga qaytardi, qidiruv davom etadi
            setState("SEARCHING");
            setSearchSeconds(0);
            if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
            searchIntervalRef.current = window.setInterval(() => setSearchSeconds((n) => n + 1), 1000);
            showToast({ id: "octagon-opp-cancelled", color: "yellow", message: i18n.t("octagon.radar.opponentCancelled") });
          } else {
            setState("IDLE");
          }
        },

        onRevengeRequested: () => {
          // Raqib qayta o'ynashni so'radi — natija ekranida "Qabul qilish" tugmasi
          setRematch((prev) => (prev.status === "waiting" ? prev : { status: "offered" }));
          OctagonAudio.playMatchFound();
        },

        onRevengeUnavailable: (data) => {
          clearTimer(rematchTimerRef);
          setRematch({ status: "unavailable", reason: data.reason });
        },

        onCountdownTick: (count) => {
          setState("COUNTDOWN");
          setCountdown(count);
          OctagonAudio.playCountdownTick(count);
        },

        onMatchStarted: (data) => {
          setState("PLAYING");
          setCurrentIndex(0);
          setMyAnswers({});
          setMyResults({});
          setMyScore(0);
          resetRematch();
          OctagonAudio.playMatchStart();
          startMatchClock(data.totalDurationSec || OCTAGON_CONFIG.TOTAL_GAME_TIME_SEC);
        },

        onOpponentProgress: (progress) => {
          const prev = oppProgressRef.current;
          oppProgressRef.current = progress;
          setOppResults((r) => nextOppResults(r, prev, progress));
          setOppProgress(progress);
        },

        onOpponentReaction: (emojiId) => {
          // Raqib spam qilsa (1.5 s da 3 tadan ko'p) — 8 soniya uning reaksiyalari ko'rsatilmaydi
          if (!oppFloodRef.current.hit(Date.now())) return;
          addFlyingEmoji(REACTION_EMOJI[emojiId] || "🔥", false);
        },

        onMatchEnded: (data) => {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          const myId = user ? String(user.id) : undefined;
          const isWin =
            !data.isDraw &&
            Boolean(
              (data.winnerId && myId && data.winnerId === myId) ||
                (data.finalScores && data.finalScores.me > data.finalScores.opponent) ||
                (data.myDeltaElo && data.myDeltaElo > 0)
            );
          setMatchResult({ ...data, isWin });
          setState("MATCH_FINISHED");
          setLinkDown(false);

          if (isWin) {
            OctagonAudio.playVictory();
            fireConfetti();
          } else {
            OctagonAudio.playDefeat();
          }
          refreshStats();
        },

        onReconnect: async (data) => {
          // Sahifa yangilangan yoki tarmoq uzilgan bo'lsa ham jang to'liq tiklanadi
          if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
          setLinkDown(false);
          setMatchId(data.matchId);
          if (data.opponent) setOpponent(data.opponent);
          if (data.opponentProgress) {
            const restored: OpponentProgress = {
              questionIndex: data.opponentProgress.questionIndex ?? Math.max(0, data.opponentProgress.answeredCount - 1),
              answeredCount: data.opponentProgress.answeredCount,
              correctCount: data.opponentProgress.correctCount,
              totalQuestions: data.opponentProgress.totalQuestions,
              finished: data.opponentProgress.finished,
            };
            const prev = oppProgressRef.current;
            oppProgressRef.current = restored;
            setOppResults((r) => nextOppResults(r, prev, restored));
            setOppProgress(restored);
          }
          const answers: Record<number, number> = {};
          Object.entries(data.myAnswers || {}).forEach(([k, v]) => {
            answers[Number(k)] = v;
          });
          setMyAnswers(answers);
          if (typeof data.myScore === "number") setMyScore(data.myScore);
          if (data.questionIds && data.questionIds.length > 0) {
            try {
              await loadQuestions(data.questionIds, data.questions);
            } catch {
              // savollar keyingi urinishda yuklanadi
            }
          }
          setCurrentIndex(data.questionIndex);
          if (data.started === false) {
            setState("MATCH_FOUND");
            return;
          }
          setState("PLAYING");
          startMatchClock(data.remainingTimeSec);
        },

        onAnswerResult: (data) => {
          setMyScore(data.myScore);
          setMyResults((prev) => ({ ...prev, [data.questionId]: data.isCorrect }));
        },

        onMatchError: (data) => {
          if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
          setState("IDLE");
          setSearchSeconds(0);
          showToast({ color: "red", message: data.message || i18n.t("octagon.common.matchError") });
        },

        onChallengeReceived: (data) => {
          setIncomingChallenge(data);
          OctagonAudio.playMatchFound();
        },
        onChallengeSent: (data) => {
          const current = outgoingRef.current;
          if (!current || current.targetUserId !== data.targetUserId) return;
          const expiresInSec = data.expiresInSec || 30;
          setOutgoingChallenge({ ...current, challengeId: data.challengeId, expiresInSec, status: "waiting" });
          clearTimer(outgoingTimeoutRef);
          // Server CHALLENGE_TIMEOUT yubormasa ham (tarmoq) kutish abadiy davom etmasin
          outgoingTimeoutRef.current = window.setTimeout(() => {
            setOutgoingChallenge((prev) => (prev && prev.status === "waiting" ? { ...prev, status: "timeout" } : prev));
          }, (expiresInSec + 3) * 1000);
        },
        onChallengeRejected: (data) => {
          clearTimer(outgoingTimeoutRef);
          setOutgoingChallenge((prev) =>
            prev && (!prev.challengeId || prev.challengeId === data.challengeId) ? { ...prev, status: "rejected" } : prev
          );
        },
        onChallengeCancelled: (data) => {
          if (incomingRef.current?.challengeId === data.challengeId) {
            setIncomingChallenge(null);
            showToast({ color: "gray", message: i18n.t("octagon.challenge.cancelled") });
          }
        },
        onChallengeError: (data) => {
          if (inviteJoinPendingRef.current) {
            // Kod bilan qo'shilish javobi: oyna ochiq bo'lsa xato shu yerda, aks holda (havola orqali) — toast
            inviteJoinPendingRef.current = false;
            clearTimer(inviteJoinTimeoutRef);
            const message = data.message || i18n.t("octagon.duel.codeNotFound");
            setInviteJoin({ status: "error", code: data.code, message });
            if (!showDuelModalRef.current) showToast({ color: "red", message });
            return;
          }
          if (outgoingRef.current) {
            clearTimer(outgoingTimeoutRef);
            setOutgoingChallenge((prev) =>
              prev
                ? { ...prev, status: data.code === "CHALLENGE_TIMEOUT" ? "timeout" : "error", message: data.message }
                : prev
            );
            return;
          }
          showToast({ color: "red", message: data.message || i18n.t("octagon.common.error") });
        },

        onLoginRequired: () => {
          socketRef.current = null;
          setState("IDLE");
          setShowAuthGate(true);
        },

        // Barcha qayta ulanishlar muvaffaqiyatsiz: "qidirilmoqda"da abadiy qolmaslik
        onConnectionLost: () => {
          if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
          socketRef.current = null;
          setSearchSeconds(0);
          setLinkDown(false);
          if (LIVE_MATCH_STATES.includes(stateRef.current) && timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          // Jang paytida barcha urinishlar tugadi — "Aloqa uzildi" ekrani (Lobbiga qaytish tugmasi bilan)
          setState((prev) =>
            prev === "SEARCHING" || prev === "AUTH_CHECK" ? "IDLE" : LIVE_MATCH_STATES.includes(prev) ? "DISCONNECTED" : prev
          );
          showToast({
            id: "octagon-connection-lost",
            color: "red",
            message: i18n.t("octagon.common.connectionLost"),
          });
        },

        // Group Room callbacks
        onRoomCreated: (room) => {
          setCurrentRoom(room);
          setShowGroupModal(true);
          setRoomErrorMessage(null);
        },
        onRoomJoined: (room) => {
          setCurrentRoom(room);
          setShowGroupModal(true);
          setRoomErrorMessage(null);
        },
        onRoomUpdated: (room) => {
          setCurrentRoom(room);
        },
        onRoomLeft: () => {
          setCurrentRoom(null);
        },
        onRoomError: (data) => {
          setRoomErrorMessage(data.message);
        },
        onRoomGameCountdown: (count) => {
          setState("COUNTDOWN");
          setCountdown(count);
          OctagonAudio.playCountdownTick(count);
          setShowGroupModal(false);
        },
        onRoomGameStarted: async (data) => {
          setState("PLAYING");
          setCurrentIndex(0);
          setMyAnswers({});
          setMyResults({});
          setOppResults([]);
          setMyScore(0);
          resetRematch();
          setRoomStandings(null);
          setShowGroupModal(false);
          OctagonAudio.playMatchStart();
          startMatchClock(data.totalDurationSec || OCTAGON_CONFIG.TOTAL_GAME_TIME_SEC);
          try {
            await loadQuestions(data.questionIds, data.questions);
          } catch {
            // Failover
          }
        },
        onGroupProgress: () => {
          // guruh balli yakunda ko'rsatiladi
        },
        onGroupMatchEnded: (data) => {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setRoomStandings(data.standings);
          setMatchResult(null);
          setState("MATCH_FINISHED");
          OctagonAudio.playVictory();
          fireConfetti();
          refreshStats();
        },
      },
      fetchTicket
    );

    socket.connect(ticket);
    socketRef.current = socket;
    return socket;
  }, [user, addFlyingEmoji, refreshStats, startMatchClock, setLinkDown, resetRematch]);

  const pendingSocketRef = useRef<Promise<OctagonSocket> | null>(null);
  const initSocket = useCallback((): Promise<OctagonSocket> => {
    if (socketRef.current) return Promise.resolve(socketRef.current);
    if (!pendingSocketRef.current) {
      pendingSocketRef.current = createSocket().finally(() => {
        pendingSocketRef.current = null;
      });
    }
    return pendingSocketRef.current;
  }, [createSocket]);

  // Tizimga kirgan foydalanuvchi lobbiga kirishi bilan ulanadi: do'stlar uni "onlayn" ko'radi
  // (chaqiruv keladi) va sahifa yangilanganda davom etayotgan jang tiklanadi.
  const socketOwnerRef = useRef<string | null>(null);
  useEffect(() => {
    const owner = user?.id != null ? String(user.id) : null;
    if (socketRef.current && socketOwnerRef.current !== owner) {
      socketRef.current.close();
      socketRef.current = null;
    }
    socketOwnerRef.current = owner;
    if (!owner) return;
    initSocket().catch(() => {
      // tarmoq yo'q — foydalanuvchi jang tugmasini bosganda qayta uriniladi
    });
  }, [user, initSocket]);

  // Internet qaytdi yoki tab qayta ochildi — 45 s grace tugamasdan darhol qayta ulanamiz
  useEffect(() => {
    const nudge = () => {
      if (document.visibilityState === "hidden") return;
      socketRef.current?.reconnectNow();
    };
    window.addEventListener("online", nudge);
    document.addEventListener("visibilitychange", nudge);
    return () => {
      window.removeEventListener("online", nudge);
      document.removeEventListener("visibilitychange", nudge);
    };
  }, []);

  const beginSearch = useCallback(async () => {
    try {
      setState("SEARCHING");
      setSearchSeconds(0);
      setQueueStatus(null);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = window.setInterval(() => {
        setSearchSeconds((s) => s + 1);
      }, 1000);

      const socket = await initSocket();
      socket.joinQueue(0, myStats?.eloRating || 0);
    } catch {
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      setState("IDLE");
      showToast({ color: "red", message: i18n.t("octagon.common.connectionLost") });
    }
  }, [myStats, initSocket]);

  // "Random 1 vs 1"
  const startSearch = useCallback(() => {
    if (!requireAuth()) return;
    const rulesAccepted = sessionStorage.getItem("octagon_rules_accepted");
    if (!rulesAccepted) {
      setShowRulesModal(true);
      return;
    }
    void beginSearch();
  }, [requireAuth, beginSearch]);

  const confirmRulesAndSearch = useCallback(() => {
    sessionStorage.setItem("octagon_rules_accepted", "true");
    setShowRulesModal(false);
    if (!requireAuth()) return;
    void beginSearch();
  }, [requireAuth, beginSearch]);

  const openDuel = useCallback(() => {
    if (requireAuth()) setShowDuelModal(true);
  }, [requireAuth]);

  const openGroup = useCallback(() => {
    if (requireAuth()) setShowGroupModal(true);
  }, [requireAuth]);

  const openHistory = useCallback(() => {
    if (requireAuth()) setShowHistoryModal(true);
  }, [requireAuth]);

  const cancelSearch = useCallback(() => {
    searchCancelledAtRef.current = Date.now();
    socketRef.current?.leaveQueue();
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    setState("IDLE");
    setSearchSeconds(0);
    setQueueStatus(null);
    setLinkDown(false);
  }, [setLinkDown]);

  // 350 ms himoya: savol endigina chiqqanda (oldingi savolga mo'ljallangan) bosish hisobga olinmaydi —
  // server ham 350 ms dan tez javobni sanamaydi
  useEffect(() => {
    questionShownAtRef.current = Date.now();
  }, [currentIndex, questions, state]);

  // (questionId, selectedIndex) — arena onSubmitAnswer(question.id, optionIndex) chaqiradi.
  const submitAnswer = useCallback(
    (questionId: number, selectedIndex: number) => {
      if (state !== "PLAYING" || questions.length === 0) return;
      if (Date.now() - questionShownAtRef.current < OCTAGON_CONFIG.ANSWER_INPUT_GUARD_MS) return;
      const currentQ = questions[currentIndex];
      if (!currentQ || currentQ.id !== questionId || myAnswers[currentQ.id] !== undefined) return;
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= (currentQ.options?.length ?? 0)) return;

      setMyAnswers((prev) => ({ ...prev, [currentQ.id]: selectedIndex }));

      if (socketRef.current) {
        if (currentRoom) {
          socketRef.current.submitRoomAnswer(currentQ.id, selectedIndex);
        } else {
          socketRef.current.submitAnswer(matchId, currentQ.id, selectedIndex);
        }
      }

      if (currentIndex + 1 < questions.length) {
        setTimeout(() => {
          setCurrentIndex((idx) => idx + 1);
        }, 300);
      }
    },
    [state, questions, currentIndex, myAnswers, matchId, currentRoom]
  );

  const sendReaction = useCallback(
    (emojiId: string) => {
      if (!socketRef.current || !matchId || reactionsMuted) return;
      if (!myFloodRef.current.hit(Date.now())) {
        // 1.5 s ichida 3 tadan ko'p — reaksiyalar 8 soniya o'chadi
        setReactionsMuted(true);
        clearTimer(muteTimerRef);
        muteTimerRef.current = window.setTimeout(() => setReactionsMuted(false), OCTAGON_CONFIG.REACTION_MUTE_MS);
        return;
      }
      socketRef.current.sendReaction(matchId, emojiId);
      addFlyingEmoji(REACTION_EMOJI[emojiId] || "🔥", true);
    },
    [matchId, addFlyingEmoji, reactionsMuted]
  );

  const requestRevenge = useCallback(() => {
    if (!socketRef.current || !matchId) return;
    setRematch({ status: "waiting" });
    clearTimer(rematchTimerRef);
    // Raqib 30 s ichida javob bermasa — kutish to'xtaydi ("Raqib javob bermadi")
    rematchTimerRef.current = window.setTimeout(() => {
      setRematch((prev) => (prev.status === "waiting" ? { status: "timeout" } : prev));
    }, OCTAGON_CONFIG.REMATCH_WAIT_SEC * 1000);
    socketRef.current.requestRevenge(matchId);
  }, [matchId]);

  /** Jangni o'z ixtiyori bilan tark etish: raqib darhol texnik g'alaba oladi, server natijani yuboradi. */
  const forfeitMatch = useCallback(() => {
    if (socketRef.current && matchId) socketRef.current.forfeitMatch(matchId);
  }, [matchId]);

  // --- Do'st bilan 1v1 ---
  const sendChallenge = useCallback(
    async (target: UserSearchResult) => {
      if (!requireAuth()) return;
      clearTimer(outgoingTimeoutRef);
      const pending: OutgoingChallenge = {
        targetUserId: target.userId,
        targetName: target.displayName,
        targetAvatar: target.avatarUrl,
        targetElo: target.eloRating,
        expiresInSec: 30,
        status: "sending",
      };
      outgoingRef.current = pending;
      setOutgoingChallenge(pending);
      try {
        const socket = await initSocket();
        socket.sendChallenge(target.userId);
      } catch {
        setOutgoingChallenge({ ...pending, status: "error", message: i18n.t("octagon.common.connectionLost") });
      }
    },
    [initSocket, requireAuth]
  );

  const cancelChallenge = useCallback(() => {
    const current = outgoingRef.current;
    clearTimer(outgoingTimeoutRef);
    if (current?.challengeId) socketRef.current?.cancelChallenge(current.challengeId);
    outgoingRef.current = null;
    setOutgoingChallenge(null);
  }, []);

  const clearOutgoing = useCallback(() => {
    clearTimer(outgoingTimeoutRef);
    outgoingRef.current = null;
    setOutgoingChallenge(null);
  }, []);

  /**
   * Havola (?code=1234 / eski ?duel=KOD), QR yoki 4 katakli PIN orqali do'st jangiga qo'shilish.
   * Duel oynasi ochiq qoladi: jang topilsa o'zi yopiladi, xato bo'lsa xabar oynada ko'rinadi.
   */
  const joinInvite = useCallback(
    async (code: string) => {
      const clean = code.replace(/\s+/g, "").toUpperCase();
      if (!clean || !requireAuth()) return;
      setInviteJoin({ status: "joining", code: clean });
      try {
        const socket = await initSocket();
        inviteJoinPendingRef.current = true;
        socket.joinInvite(clean);
        if (!showDuelModalRef.current) {
          showToast({ id: "octagon-invite", color: "grape", message: i18n.t("octagon.duel.joiningInvite") });
        }
        clearTimer(inviteJoinTimeoutRef);
        inviteJoinTimeoutRef.current = window.setTimeout(() => {
          if (!inviteJoinPendingRef.current) return;
          inviteJoinPendingRef.current = false;
          setInviteJoin({ status: "error", message: i18n.t("octagon.common.connectionLost") });
        }, 10_000);
      } catch {
        inviteJoinPendingRef.current = false;
        setInviteJoin({ status: "error", message: i18n.t("octagon.common.connectionLost") });
        showToast({ color: "red", message: i18n.t("octagon.common.connectionLost") });
      }
    },
    [initSocket, requireAuth]
  );

  const resetInviteJoin = useCallback(() => {
    inviteJoinPendingRef.current = false;
    clearTimer(inviteJoinTimeoutRef);
    setInviteJoin({ status: "idle" });
  }, []);

  const acceptChallenge = useCallback((challengeId: string) => {
    socketRef.current?.acceptChallenge(challengeId);
    setIncomingChallenge(null);
  }, []);

  const rejectChallenge = useCallback((challengeId: string) => {
    socketRef.current?.rejectChallenge(challengeId);
    setIncomingChallenge(null);
  }, []);

  // --- Guruhli jang ---
  const createRoom = useCallback(
    async (maxPlayers = 4, isPrivate = false) => {
      if (!requireAuth()) return;
      try {
        const socket = await initSocket();
        socket.createRoom(maxPlayers, isPrivate);
      } catch {
        setRoomErrorMessage(i18n.t("octagon.common.connectionLost"));
      }
    },
    [initSocket, requireAuth]
  );

  const joinRoom = useCallback(
    async (roomCode: string) => {
      if (!requireAuth()) return;
      try {
        const socket = await initSocket();
        socket.joinRoom(roomCode);
      } catch {
        setRoomErrorMessage(i18n.t("octagon.common.connectionLost"));
      }
    },
    [initSocket, requireAuth]
  );

  const leaveRoom = useCallback(() => {
    socketRef.current?.leaveRoom();
    setCurrentRoom(null);
    setShowGroupModal(false);
  }, []);

  const toggleReady = useCallback((ready: boolean) => {
    socketRef.current?.toggleReady(ready);
  }, []);

  const startRoomGame = useCallback(() => {
    socketRef.current?.startRoomGame();
  }, []);

  const returnToLobby = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setState("IDLE");
    setMatchId("");
    setOpponent(null);
    setQuestions([]);
    setCurrentIndex(0);
    setMyAnswers({});
    setMatchResult(null);
    resetRematch();
    setCurrentRoom(null);
    setRoomStandings(null);
    setMyResults({});
    setOppResults([]);
    setQueueStatus(null);
    setLinkDown(false);
    imagePreloader.clear();
    refreshStats();
    // "Aloqa uzildi"dan qaytilganda socket yo'q — lobbida yana onlayn bo'lamiz (jang tirik bo'lsa server tiklaydi)
    if (!socketRef.current && user?.id != null) initSocket().catch(() => {});
  }, [refreshStats, setLinkDown, user, initSocket, resetRematch]);

  return {
    state,
    myStats,
    statsLoaded,
    searchSeconds,
    queueStatus,
    countdown,
    remainingTimeSec,
    matchId,
    opponent,
    questions,
    currentQuestion: questions[currentIndex] || null,
    currentIndex,
    totalQuestions: questions.length || OCTAGON_CONFIG.QUESTIONS_PER_MATCH,
    myAnswers,
    myScore,
    oppProgress,
    myTrack: buildMyTrack(
      questions.map((q) => q.id),
      myAnswers,
      myResults
    ),
    oppTrack: buildOppTrack(questions.length || OCTAGON_CONFIG.QUESTIONS_PER_MATCH, oppProgress.answeredCount, oppResults),
    matchResult,
    flyingEmojis,
    revengeRequested: rematch.status === "waiting",
    rematch,
    forfeitMatch,
    reconnecting,
    reconnectLeftSec,
    reactionsMuted,
    currentRoom,
    roomErrorMessage,
    roomStandings,
    incomingChallenge,
    outgoingChallenge,
    showRulesModal,
    setShowRulesModal,
    showAuthGate,
    setShowAuthGate,
    showLeaderboard,
    setShowLeaderboard,
    showDuelModal,
    setShowDuelModal,
    showGroupModal,
    setShowGroupModal,
    showHistoryModal,
    setShowHistoryModal,
    startSearch,
    confirmRulesAndSearch,
    cancelSearch,
    submitAnswer,
    sendReaction,
    requestRevenge,
    returnToLobby,
    refreshStats,
    openDuel,
    openGroup,
    openHistory,
    sendChallenge,
    cancelChallenge,
    clearOutgoing,
    joinInvite,
    inviteJoin,
    resetInviteJoin,
    acceptChallenge,
    rejectChallenge,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startRoomGame,
  };
}
