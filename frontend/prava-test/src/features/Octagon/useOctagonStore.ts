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

  // Modal triggers
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDuelModal, setShowDuelModal] = useState(false);

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
        setMatchResult(data);
        setState("MATCH_FINISHED");

        if (data.isDraw) {
          OctagonAudio.playDefeat();
        } else if (data.winnerId && data.winnerId === (user ? String(user.id) : localStorage.getItem("octagon_guest_id"))) {
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
        socketRef.current.submitAnswer(matchId, currentQ.id, selectedIndex);
      }

      // Move to next question after small delay
      if (currentIndex + 1 < questions.length) {
        setTimeout(() => {
          setCurrentIndex((idx) => idx + 1);
        }, 300);
      }
    },
    [state, questions, currentIndex, myAnswers, matchId]
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
    showRulesModal,
    setShowRulesModal,
    showGuestModal,
    setShowGuestModal,
    showLeaderboard,
    setShowLeaderboard,
    showDuelModal,
    setShowDuelModal,
    startSearch,
    confirmRulesAndSearch,
    cancelSearch,
    submitAnswer,
    sendReaction,
    requestRevenge,
    returnToLobby,
    refreshStats,
  };
}
