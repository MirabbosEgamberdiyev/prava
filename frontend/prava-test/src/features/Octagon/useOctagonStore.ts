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
  type IncomingChallenge,
} from "./types";
import { OctagonApi } from "./OctagonApi";
import { OctagonSocket } from "./OctagonSocket";
import { OctagonAudio } from "./OctagonAudio";
import { imagePreloader } from "./OctagonImagePreloader";
import { fireConfetti } from "./confetti";
import { OctagonGuest } from "./guestIdentity";
import { showToast } from "../../utils/notificationUtils";
import i18n from "../../utils/i18n";

export function useOctagonStore(user: { id?: number | string; firstName?: string } | null) {
  const [state, setState] = useState<OctagonState>("IDLE");
  const [myStats, setMyStats] = useState<UserStats | null>(null);

  // Search & Match timers
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [remainingTimeSec, setRemainingTimeSec] = useState(300);

  // Match information
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

  // Group room states
  const [currentRoom, setCurrentRoom] = useState<GroupRoom | null>(null);
  const [roomErrorMessage, setRoomErrorMessage] = useState<string | null>(null);
  const [roomStandings, setRoomStandings] = useState<Array<{ userId: string; displayName: string; avatarUrl: string; score: number; answeredCount: number }> | null>(null);

  // Incoming challenge
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge | null>(null);

  // Modal triggers
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const socketRef = useRef<OctagonSocket | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const searchIntervalRef = useRef<number | null>(null);

  // Load user stats on mount
  const refreshStats = useCallback(async () => {
    try {
      // Mehmon o'z statistikasini server bergan token bilan oladi
      const uid = user ? String(user.id) : OctagonGuest.getToken();
      const stats = await OctagonApi.getStats(uid);
      if (stats) setMyStats(stats);
    } catch {
      // Offline or network error
    }
  }, [user]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };
  }, []);

  // Flying emojis cleanup
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

  // Connect socket and handle events
  const createSocket = useCallback(async (): Promise<OctagonSocket> => {
    if (socketRef.current) return socketRef.current;

    // Ticket bir martalik: birinchi ulanishda ham, har bir qayta ulanishda ham yangisi olinadi.
    // Avval laqab "octagon_guest_name" kalitidan o'qilardi, saqlanishi esa "octagon_guest_nickname"da edi.
    const fetchTicket = async (): Promise<string> => {
      const info = await OctagonApi.getTicket(
        user ? undefined : OctagonGuest.getToken(),
        user ? undefined : OctagonGuest.getNickname()
      );
      if (!user) OctagonGuest.save(info.guestId, info.userId);
      return info.ticket;
    };

    const ticket = await fetchTicket();
    if (!ticket) {
      throw new Error("Failed to obtain One-Time Ticket");
    }

    const loadQuestions = async (ids: number[], embedded?: OctagonQuestion[]) => {
      // Server savollarni event ichida yuboradi; eski server bo'lsa REST'dan olinadi
      const qList = embedded && embedded.length > 0 ? embedded : await OctagonApi.getQuestions(ids);
      setQuestions(qList);
      const imageUrls = qList.map((q) => q.imageUrl).filter((u): u is string => Boolean(u));
      imagePreloader.preloadImages(imageUrls);
    };

    const socket = new OctagonSocket({
      onMatchFound: async (data) => {
        setMatchId(data.matchId);
        setOpponent(data.opponent);
        setOppProgress({ questionIndex: 0, answeredCount: 0, correctCount: 0 });
        setState("MATCH_FOUND");
        if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);

        // Fetch question details without answers (OWASP anti-cheat)
        try {
          if (data.questions && data.questions.length > 0) {
            await loadQuestions(data.questionIds, data.questions);
            return;
          }
          const qList = await OctagonApi.getQuestions(data.questionIds);
          setQuestions(qList);

          // Preload images via worker pool
          const imageUrls = qList.map((q) => q.imageUrl).filter((u): u is string => Boolean(u));
          imagePreloader.preloadImages(imageUrls);
        } catch {
          // Preload failover
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
        setRemainingTimeSec(data.totalDurationSec || 300);
        OctagonAudio.playMatchStart();

        // Start match timer
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
      },

      onOpponentProgress: (progress) => {
        setOppProgress(progress);
      },

      onOpponentReaction: (emojiId) => {
        const emojiMap: Record<string, string> = {
          fire: "🔥",
          thumbs_up: "👍",
          mindblown: "😱",
          laugh: "😂",
        };
        addFlyingEmoji(emojiMap[emojiId] || "🔥", false);
      },

      onMatchEnded: (data) => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const myId = user ? String(user.id) : OctagonGuest.getPublicId();
        const isWin = !data.isDraw && Boolean(
          (data.winnerId && myId && data.winnerId === myId) ||
          (data.finalScores && data.finalScores.me > data.finalScores.opponent) ||
          (data.myDeltaElo && data.myDeltaElo > 0)
        );
        const enrichedResult: MatchResultData = {
          ...data,
          isWin,
        };
        setMatchResult(enrichedResult);
        setState("MATCH_FINISHED");

        if (data.isDraw) {
          OctagonAudio.playDefeat();
        } else if (isWin) {
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
        setMatchId(data.matchId);
        if (data.opponent) setOpponent(data.opponent);
        if (data.opponentProgress) {
          setOppProgress({
            questionIndex: Math.max(0, data.opponentProgress.answeredCount - 1),
            answeredCount: data.opponentProgress.answeredCount,
            correctCount: data.opponentProgress.correctCount,
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
            // REST zaxira ham ishlamadi — savollar keyingi urinishda yuklanadi
          }
        }
        setCurrentIndex(data.questionIndex);
        setRemainingTimeSec(data.remainingTimeSec);
        if (data.started === false) {
          setState("MATCH_FOUND");
          return;
        }
        setState("PLAYING");
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
      },

      onAnswerResult: (data) => {
        // Avval o'z balli o'yin davomida doim 0 ko'rinardi — server natija yubormasdi
        setMyScore(data.myScore);
      },

      onMatchError: (data) => {
        if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
        setState("IDLE");
        setSearchSeconds(0);
        showToast({ color: "red", message: data.message || "Jang ochilmadi, keyinroq urinib ko'ring" });
      },

      // Direct Challenge callbacks
      onChallengeReceived: (data) => {
        setIncomingChallenge(data);
        OctagonAudio.playMatchFound();
      },
      onChallengeRejected: () => {
        // Target rejected challenge
      },
      onChallengeError: (data) => {
        showToast({ color: "red", message: data.message || i18n.t("octagon.common.error", "Xatolik yuz berdi") });
      },

      // Every reconnect attempt failed: leave "searching" instead of spinning forever, and let the next
      // "Qidirish" click build a fresh socket.
      onConnectionLost: () => {
        if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
        socketRef.current = null;
        setSearchSeconds(0);
        setState((prev) => (prev === "SEARCHING" || prev === "AUTH_CHECK" ? "IDLE" : prev));
        showToast({
          id: "octagon-connection-lost",
          color: "red",
          message: i18n.t("octagon.common.connectionLost", "Oktagon serveriga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."),
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
        setRemainingTimeSec(data.totalDurationSec || 300);
        setShowGroupModal(false);
        OctagonAudio.playMatchStart();

        try {
          await loadQuestions(data.questionIds, data.questions);
        } catch {
          // Failover
        }
      },
      onGroupProgress: (_data) => {
        // live group score sync
      },
      onGroupMatchEnded: (data) => {
        setRoomStandings(data.standings);
        setState("MATCH_FINISHED");
        OctagonAudio.playVictory();
        fireConfetti();
        refreshStats();
      },
    }, fetchTicket);

    socket.connect(ticket);
    socketRef.current = socket;
    return socket;
  }, [user, addFlyingEmoji, refreshStats]);

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

  // Lobbiga kirilganda ulanamiz: aks holda do'stlar "offline" ko'rinadi (chaqiruv yuborib bo'lmaydi)
  // va sahifa yangilangandan keyin davom etayotgan jang tiklanmaydi.
  const socketOwnerRef = useRef<string | null>(null);
  useEffect(() => {
    // Mehmon sifatida ochilgan socket tizimga kirgandan keyin foydalanuvchi socketiga almashtiriladi
    const owner = user?.id != null ? String(user.id) : "guest";
    if (socketRef.current && socketOwnerRef.current !== owner) {
      socketRef.current.close();
      socketRef.current = null;
    }
    socketOwnerRef.current = owner;
    if (!user && !OctagonGuest.getToken()) return;
    initSocket().catch(() => {
      // tarmoq yo'q — foydalanuvchi "Qidirish"ni bosganda qayta uriniladi
    });
  }, [user, initSocket]);

  // Click: "QIDIRISHNI BOSHLASH"
  const startSearch = useCallback(async () => {
    // If not authenticated and no guest pass, prompt modal
    if (!user && !OctagonGuest.hasPass()) {
      setShowGuestModal(true);
      return;
    }

    // Check rules confirmation (once per session)
    const rulesAccepted = sessionStorage.getItem("octagon_rules_accepted");
    if (!rulesAccepted) {
      setShowRulesModal(true);
      return;
    }

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
      setState("IDLE");
    }
  }, [user, myStats, initSocket]);

  const confirmRulesAndSearch = useCallback((_duelCode?: string) => {
    sessionStorage.setItem("octagon_rules_accepted", "true");
    setShowRulesModal(false);
    startSearch();
  }, [startSearch]);

  const cancelSearch = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.leaveQueue();
    }
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
    }
    setState("IDLE");
    setSearchSeconds(0);
  }, []);

  // (questionId, selectedIndex) — the arena calls onSubmitAnswer(question.id, optionIndex). The old
  // one-argument signature took question.id AS the selected option (TypeScript accepts a shorter
  // parameter list), so every web/desktop answer was sent as an invalid index and scored 0.
  const submitAnswer = useCallback(
    (questionId: number, selectedIndex: number) => {
      if (state !== "PLAYING" || questions.length === 0) return;
      const currentQ = questions[currentIndex];
      if (!currentQ || currentQ.id !== questionId || myAnswers[currentQ.id] !== undefined) return;
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= (currentQ.options?.length ?? 0)) return;

      // Update state locally
      setMyAnswers((prev) => ({ ...prev, [currentQ.id]: selectedIndex }));

      // Send via socket
      if (socketRef.current) {
        if (currentRoom) {
          socketRef.current.submitRoomAnswer(currentQ.id, selectedIndex);
        } else {
          socketRef.current.submitAnswer(matchId, currentQ.id, selectedIndex);
        }
      }

      // Move to next question after small delay
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
      const emojiMap: Record<string, string> = {
        fire: "🔥",
        thumbs_up: "👍",
        mindblown: "😱",
        laugh: "😂",
      };
      addFlyingEmoji(emojiMap[emojiId] || "🔥", true);
    },
    [matchId, addFlyingEmoji]
  );

  const requestRevenge = useCallback(() => {
    if (!socketRef.current || !matchId) return;
    setRevengeRequested(true);
    socketRef.current.requestRevenge(matchId);
  }, [matchId]);

  // Friend Duel Actions
  const sendChallenge = useCallback(async (targetUserId: string) => {
    try {
      const socket = await initSocket();
      socket.sendChallenge(targetUserId);
    } catch (e) {
      console.error(e);
    }
  }, [initSocket]);

  const acceptChallenge = useCallback((challengeId: string) => {
    if (socketRef.current) {
      socketRef.current.acceptChallenge(challengeId);
    }
    setIncomingChallenge(null);
  }, []);

  const rejectChallenge = useCallback((challengeId: string) => {
    if (socketRef.current) {
      socketRef.current.rejectChallenge(challengeId);
    }
    setIncomingChallenge(null);
  }, []);

  // Group Room Actions
  const createRoom = useCallback(async (maxPlayers = 4, isPrivate = false) => {
    try {
      const socket = await initSocket();
      socket.createRoom(maxPlayers, isPrivate);
    } catch (e) {
      console.error(e);
    }
  }, [initSocket]);

  const joinRoom = useCallback(async (roomCode: string) => {
    try {
      const socket = await initSocket();
      socket.joinRoom(roomCode);
    } catch (e) {
      console.error(e);
    }
  }, [initSocket]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.leaveRoom();
    }
    setCurrentRoom(null);
    setShowGroupModal(false);
  }, []);

  const toggleReady = useCallback((ready: boolean) => {
    if (socketRef.current) {
      socketRef.current.toggleReady(ready);
    }
  }, []);

  const startRoomGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.startRoomGame();
    }
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
    currentRoom,
    roomErrorMessage,
    roomStandings,
    incomingChallenge,
    showRulesModal,
    setShowRulesModal,
    showGuestModal,
    setShowGuestModal,
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
    sendChallenge,
    acceptChallenge,
    rejectChallenge,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startRoomGame,
  };
}
