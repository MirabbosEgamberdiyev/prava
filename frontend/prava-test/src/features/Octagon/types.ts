export const OCTAGON_CONFIG = {
  // O'yin qoidalari
  QUESTIONS_PER_MATCH: 10,           // Har bir 1v1 jangda qat'iy 10 ta savol
  PER_QUESTION_TIME_SEC: 30,         // Savol boshiga ajratilgan maksimal vaqt
  TOTAL_GAME_TIME_SEC: 300,          // Butun o'yinning mutlaq vaqt chegarasi (5 daqiqa)
  COUNTDOWN_SEC: 3,                  // Jang boshlanishidan oldingi sanash (3, 2, 1, JANG!)
  MATCH_START_PRELOAD_MS: 8000,      // Match topilgandan game_start gacha bo'lgan vaqt (8s)

  // Anti-Cheat va Vaqt
  MIN_ANSWER_LATENCY_MS: 350,        // 350ms dan tez javoblar bot/cheat deb rad etiladi
  CLIENT_SERVER_CLOCK_TOLERANCE_MS: 1500,

  // Resurslarni oldindan yuklash (Preloading)
  PRELOAD_WORKER_CONCURRENCY: 3,     // Savol rasmlarini 3 ta parallel oqimda oldindan keshga olish

  // Emodjilar va Anti-Flood
  REACTION_FLIGHT_MS: 1400,          // Ekranda emodji uchib o'tish animatsiyasi (1.4s)
  REACTION_COOLDOWN_MS: 1500,        // Reaksiya yuborish oralig'i
  REACTION_FLOOD_LIMIT: 3,           // 3 marta ketma-ket spam qilinsa 8 soniyaga bloklash

  // Tarmoq va Qayta Ulanish (Resilience)
  WS_HEARTBEAT_INTERVAL_MS: 15000,   // Ping-pong intervali (15 soniya)
  RECONNECT_GRACE_PERIOD_SEC: 45,    // O'yinchi 45 soniya ichida qaytsa match tiklanadi
  MAX_RECONNECT_ATTEMPTS: 6,         // Eksponensial kechikish bilan ~45 s grace-period ichida
  RECONNECT_BASE_DELAY_MS: 2000,     // Boshlang'ich kechikish
  RECONNECT_JITTER_MS: 1500,         // To'qnashuvni oldini oluvchi tasodifiy jitter

  // ELO Ligalari Shkalasi
  RANK_THRESHOLDS: [
    { rank: "brilliant", minScore: 300, emoji: "💎", name: "Brilliant", deltaWin: 25, deltaLoss: 10 },
    { rank: "gold",      minScore: 150, emoji: "🥇", name: "Oltin",     deltaWin: 20, deltaLoss: 12 },
    { rank: "silver",    minScore: 50,  emoji: "🥈", name: "Kumush",    deltaWin: 18, deltaLoss: 15 },
    { rank: "bronze",    minScore: 0,   emoji: "🥉", name: "Bronza",    deltaWin: 15, deltaLoss: 15 }
  ],

  // Zaxira Bot Dvigateli
  BOT_DELAY_GAUSSIAN_MEAN_MS: 2400,  // Botning o'rtacha o'ylash vaqti (2.4s)
  BOT_PROBABILITY_CORRECT: 0.65      // Botning to'g'ri topish ehtimoli (65%)
} as const;

export type OctagonRankId = "bronze" | "silver" | "gold" | "brilliant";

export type OctagonState =
  | "IDLE"
  | "AUTH_CHECK"
  | "RULES_COOLDOWN"
  | "SEARCHING"
  | "MATCH_FOUND"
  | "COUNTDOWN"
  | "PLAYING"
  | "MATCH_FINISHED"
  | "RECONNECTING";

export interface MatchOpponent {
  id: string;
  name: string;
  score: number;
  rank: OctagonRankId;
  avatar?: string;
}

export interface QuestionOptionItem {
  index: number;
  id?: number;
  textUzl: string;
  textUzc: string;
  textRu: string;
  text?: string;
}

export interface OctagonQuestion {
  id: number;
  textUzl: string;
  textUzc: string;
  textRu: string;
  text?: string;
  imageUrl?: string;
  image?: string;
  options: QuestionOptionItem[];
  explanationUzl?: string;
  explanationUzc?: string;
  explanationRu?: string;
}

export interface UserAnswerRecord {
  questionId: number;
  selectedIndex: number;
  isCorrect?: boolean;
}

export interface OpponentProgress {
  questionIndex: number;
  answeredCount: number;
  correctCount: number;
}

export interface MatchResultData {
  winnerId: string;
  isDraw: boolean;
  isWin?: boolean;
  myDeltaElo: number;
  opponentDeltaElo: number;
  finalScores: {
    me: number;
    opponent: number;
  };
}

export interface UserStats {
  userId: string;
  displayName: string;
  eloRating: number;
  rank: OctagonRankId;
  rankEmoji: string;
  rankName: string;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  maxWinStreak: number;
  totalMatches: number;
  winRate: number;
}

export interface LeaderboardUser {
  position: number;
  rankPosition?: number;
  userId: string;
  name?: string;
  displayName: string;
  eloRating: number;
  rank: OctagonRankId;
  rankEmoji: string;
  wins: number;
  totalMatches: number;
  winRate: number;
}

export type LeaderboardEntry = LeaderboardUser;

export interface FlyingEmoji {
  id: string;
  emoji: string;
  isMine: boolean;
  startX: number;
  startY: number;
}

export interface UserSearchResult {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  eloRating: number;
  rank: OctagonRankId;
  rankEmoji: string;
  rankName: string;
  isOnline: boolean;
  status: "AVAILABLE" | "IN_MATCH" | "IN_QUEUE" | "OFFLINE" | string;
}

export interface GroupRoomMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  eloRating: number;
  rankEmoji: string;
  isHost: boolean;
  isReady: boolean;
  currentScore: number;
  answeredCount: number;
}

export interface GroupRoom {
  roomCode: string;
  hostId: string;
  hostName: string;
  maxPlayers: number;
  isPrivate: boolean;
  status: "WAITING" | "COUNTDOWN" | "PLAYING" | "FINISHED";
  members: GroupRoomMember[];
  createdAt: string;
}

export interface MatchHistoryEntry {
  matchId: string;
  opponentId: string;
  opponentName: string;
  myScore: number;
  opponentScore: number;
  result: "WIN" | "LOSS" | "DRAW";
  deltaElo: number;
  durationSeconds: number;
  createdAt: string;
}

export interface IncomingChallenge {
  challengeId: string;
  challenger: {
    userId: string;
    displayName: string;
    eloRating: number;
    rank: string;
    rankEmoji: string;
  };
  expiresInSec: number;
}

