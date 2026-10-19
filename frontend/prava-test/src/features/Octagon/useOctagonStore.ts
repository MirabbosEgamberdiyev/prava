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
      const guestId = !user ? localStorage.getItem("octagon_guest_id") || undefined : undefined;
      const uid = user ? String(user.id) : guestId;
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
  const initSocket = useCallback(async (): Promise<OctagonSocket> => {
    if (socketRef.current) return socketRef.current;

    const guestId = !user ? localStorage.getItem("octagon_guest_id") || undefined : undefined;
    const guestName = !user ? localStorage.getItem("octagon_guest_name") || undefined : undefined;

    const ticket = await OctagonApi.getTicket(guestId, guestName);
    if (!ticket) {
      throw new Error("Failed to obtain One-Time Ticket");
    }

    const socket = new OctagonSocket({
      onMatchFound: async (data) => {
        setMatchId(data.matchId);
        setOpponent(data.opponent);
        setState("MATCH_FOUND");
        if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);

        // Fetch question details without answers (OWASP anti-cheat)
        try {
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
        const myId = user ? String(user.id) : localStorage.getItem("octagon_guest_id");
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

      onReconnect: (data) => {
        setState("PLAYING");
        setMatchId(data.matchId);
        setCurrentIndex(data.questionIndex);
        setRemainingTimeSec(data.remainingTimeSec);
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
        alert(data.message || "Xatolik yuz berdi");
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
          const qList = await OctagonApi.getQuestions(data.questionIds);
          setQuestions(qList);
          const imageUrls = qList.map((q) => q.imageUrl).filter((u): u is string => Boolean(u));
          imagePreloader.preloadImages(imageUrls);
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
    });

    socket.connect(ticket);
    socketRef.current = socket;
    return socket;
  }, [user, addFlyingEmoji, refreshStats]);

  // Click: "QIDIRISHNI BOSHLASH"
  const startSearch = useCallback(async () => {
    // If not authenticated and no guest pass, prompt modal
    const guestPass = localStorage.getItem("octagon_guest_id");
    if (!user && !guestPass) {
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

  const submitAnswer = useCallback(
    (selectedIndex: number) => {
      if (state !== "PLAYING" || questions.length === 0) return;
      const currentQ = questions[currentIndex];
      if (!currentQ || myAnswers[currentQ.id] !== undefined) return;

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
