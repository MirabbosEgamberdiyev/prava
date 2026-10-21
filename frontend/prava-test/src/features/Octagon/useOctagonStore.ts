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
} from "./types";
import { OctagonApi } from "./OctagonApi";
import { OctagonSocket } from "./OctagonSocket";
import { OctagonAudio } from "./OctagonAudio";
import { imagePreloader } from "./OctagonImagePreloader";
import { fireConfetti } from "./confetti";
import { showToast } from "../../utils/notificationUtils";
import i18n from "../../utils/i18n";

const REACTION_EMOJI: Record<string, string> = {
  fire: "🔥",
  thumbs_up: "👍",
  mindblown: "😱",
  laugh: "😂",
};

function clearTimer(ref: { current: number | null }) {
  if (ref.current) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

const LIVE_MATCH_STATES: OctagonState[] = ["MATCH_FOUND", "COUNTDOWN", "PLAYING", "RECONNECTING"];

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
  const [oppProgress, setOppProgress] = useState<OpponentProgress>({
    questionIndex: 0,
    answeredCount: 0,
    correctCount: 0,
  });
  const [matchResult, setMatchResult] = useState<MatchResultData | null>(null);
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const [revengeRequested, setRevengeRequested] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

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
      imagePreloader.clear();
    };
  }, []);

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
          setReconnecting(false);
        },

        onClose: () => {
          if (LIVE_MATCH_STATES.includes(stateRef.current)) setReconnecting(true);
        },

        onMatchFound: async (data) => {
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
          setOppProgress({ questionIndex: 0, answeredCount: 0, correctCount: 0 });
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

        onCountdownTick: (count) => {
          setState("COUNTDOWN");
          setCountdown(count);
          OctagonAudio.playCountdownTick(count);
        },

        onMatchStarted: (data) => {
          setState("PLAYING");
          setCurrentIndex(0);
          setMyAnswers({});
          setMyScore(0);
          setRevengeRequested(false);
          OctagonAudio.playMatchStart();
          startMatchClock(data.totalDurationSec || OCTAGON_CONFIG.TOTAL_GAME_TIME_SEC);
        },

        onOpponentProgress: (progress) => {
          setOppProgress(progress);
        },

        onOpponentReaction: (emojiId) => {
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
          setReconnecting(false);

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
          setReconnecting(false);
          setMatchId(data.matchId);
          if (data.opponent) setOpponent(data.opponent);
          if (data.opponentProgress) {
            setOppProgress({
              questionIndex: data.opponentProgress.questionIndex ?? Math.max(0, data.opponentProgress.answeredCount - 1),
              answeredCount: data.opponentProgress.answeredCount,
              correctCount: data.opponentProgress.correctCount,
              totalQuestions: data.opponentProgress.totalQuestions,
              finished: data.opponentProgress.finished,
            });
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
          setReconnecting(false);
          setState((prev) => (prev === "SEARCHING" || prev === "AUTH_CHECK" ? "IDLE" : prev));
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
          setMyScore(0);
          setRevengeRequested(false);
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
  }, [user, addFlyingEmoji, refreshStats, startMatchClock]);

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
    socketRef.current?.leaveQueue();
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    setState("IDLE");
    setSearchSeconds(0);
  }, []);

  // (questionId, selectedIndex) — arena onSubmitAnswer(question.id, optionIndex) chaqiradi.
  const submitAnswer = useCallback(
    (questionId: number, selectedIndex: number) => {
      if (state !== "PLAYING" || questions.length === 0) return;
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
      if (!socketRef.current || !matchId) return;
      socketRef.current.sendReaction(matchId, emojiId);
      addFlyingEmoji(REACTION_EMOJI[emojiId] || "🔥", true);
    },
    [matchId, addFlyingEmoji]
  );

  const requestRevenge = useCallback(() => {
    if (!socketRef.current || !matchId) return;
    setRevengeRequested(true);
    socketRef.current.requestRevenge(matchId);
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
    setRevengeRequested(false);
    setCurrentRoom(null);
    setRoomStandings(null);
    setReconnecting(false);
    imagePreloader.clear();
    refreshStats();
  }, [refreshStats]);

  return {
    state,
    myStats,
    searchSeconds,
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
    matchResult,
    flyingEmojis,
    revengeRequested,
    reconnecting,
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
