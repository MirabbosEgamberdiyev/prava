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
  REACTION_FLOOD_LIMIT: 3,           // 1.5 s ichida 3 tadan ko'p bosilsa…
  REACTION_MUTE_MS: 8000,            // …8 soniya reaksiyalar o'chadi (o'zimniki ham, raqibniki ham)
  ANSWER_INPUT_GUARD_MS: 350,        // Savol chiqqanidan 350 ms ichidagi bosish hisobga olinmaydi (server anti-cheat bilan bir xil)
  RADAR_WIDEN_AFTER_SEC: 4,          // Server 3 s dan keyin ELO oralig'ini kengaytiradi, 7 s da bot ulanadi
  REMATCH_WAIT_SEC: 30,              // Revansh so'rovi javobsiz qolsa — "Raqib javob bermadi"
  STALE_MATCH_IGNORE_MS: 10000,      // Qidiruv bekor qilingandan keyin kelgan eskirgan navbat jangi e'tiborsiz qoldiriladi

  // Tarmoq va Qayta Ulanish (Resilience)
  WS_HEARTBEAT_INTERVAL_MS: 15000,   // Ping-pong intervali (15 soniya)
  RECONNECT_GRACE_PERIOD_SEC: 45,    // O'yinchi 45 soniya ichida qaytsa match tiklanadi
  MAX_RECONNECT_ATTEMPTS: 6,         // Eksponensial kechikish bilan ~45 s grace-period ichida
  RECONNECT_BASE_DELAY_MS: 2000,     // Boshlang'ich kechikish
  RECONNECT_JITTER_MS: 1500,         // To'qnashuvni oldini oluvchi tasodifiy jitter

  // ELO Ligalari Shkalasi
  // Server OctagonRank bilan bir xil (6 liga); "brilliant" = Olmos
  RANK_THRESHOLDS: [
    { rank: "master",    minScore: 800, emoji: "👑", name: "Master",  deltaWin: 28, deltaLoss: 10 },
    { rank: "brilliant", minScore: 500, emoji: "💎", name: "Olmos",   deltaWin: 25, deltaLoss: 10 },
    { rank: "platinum",  minScore: 300, emoji: "💠", name: "Platina", deltaWin: 22, deltaLoss: 12 },
    { rank: "gold",      minScore: 150, emoji: "🥇", name: "Oltin",   deltaWin: 20, deltaLoss: 12 },
    { rank: "silver",    minScore: 50,  emoji: "🥈", name: "Kumush",  deltaWin: 18, deltaLoss: 15 },
    { rank: "bronze",    minScore: 0,   emoji: "🥉", name: "Bronza",  deltaWin: 15, deltaLoss: 15 }
  ],

  // Zaxira Bot Dvigateli
  BOT_DELAY_GAUSSIAN_MEAN_MS: 2400,  // Botning o'rtacha o'ylash vaqti (2.4s)
  BOT_PROBABILITY_CORRECT: 0.65      // Botning to'g'ri topish ehtimoli (65%)
} as const;

export type OctagonRankId = "bronze" | "silver" | "gold" | "platinum" | "brilliant" | "master";

export type OctagonState =
  | "IDLE"
  | "AUTH_CHECK"
  | "RULES_COOLDOWN"
  | "SEARCHING"
  | "MATCH_FOUND"
  | "COUNTDOWN"
  | "PLAYING"
  | "MATCH_FINISHED"
  | "RECONNECTING"
  /** 45 s ichida qayta ulanib bo'lmadi — "Aloqa uzildi" ekrani. */
  | "DISCONNECTED";

export interface MatchOpponent {
  id: string;
  name: string;
  /** ELO (eski server faqat "score" yuboradi). */
  score: number;
  elo?: number;
  rank: OctagonRankId;
  rankEmoji?: string;
  /** Profil rasmi; null — rasm yo'q (bosh harfli avatar chiziladi). */
  avatar?: string | null;
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

/** 4 xonali kod bilan do'st jangiga qo'shilish holati (duel oynasidagi PIN). */
export interface InviteJoinState {
  status: "idle" | "joining" | "error";
  code?: string;
  message?: string;
}

export interface OpponentProgress {
  questionIndex: number;
  answeredCount: number;
  correctCount: number;
  /** Jangdagi savollar soni (server yuboradi; eski server — undefined). */
  totalQuestions?: number;
  /** Raqib barcha savollarga javob berib bo'ldi — "Raqib yakunladi" banneri. */
  finished?: boolean;
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
  /** Jangdagi savollar soni — aniqlik foizi uchun (eski server yubormaydi). */
  totalQuestions?: number;
  /** Jangdan keyingi yangi ELO. */
  myNewElo?: number;
  /** Sarflangan vaqt (soniya): oxirgi javobgacha yoki jang tugaguncha. */
  myTimeSec?: number;
  /** Jang tahlili — faqat jang tugagach server yuboradi. */
  review?: ReviewItem[];
  /** Raqib uzilib qaytmadi — texnik g'alaba/mag'lubiyat. */
  forfeit?: boolean;
  /** Texnik natija menga yozildimi (men chiqdim / men qaytmadim). */
  forfeitByMe?: boolean;
  /** LEFT — "Chiqish" bosildi; DISCONNECT — 45 s ichida qaytmadi. */
  forfeitReason?: "LEFT" | "DISCONNECT";
}

/** Radar: server har 2 s da yuboradigan real navbat holati. */
export interface QueueStatus {
  /** Men bilan birga qidirayotgan boshqa o'yinchilar. */
  searching: number;
  /** Oktagonga ulangan o'yinchilar. */
  online: number;
  /** Navbatda kutilgan soniyalar (server soati). */
  waitSec?: number;
  /** Serverdagi joriy ELO. */
  elo?: number;
  /** Hozirgi qidiruv oralig'i (±); null — har qanday raqib. */
  eloRange?: number | null;
  /** Mos odam topilmasa, mashq raqibi ulanishiga qolgan soniya. */
  botInSec?: number;
}

/** Jang tahlili qatori: mening javobim va to'g'ri variant (jang tugagach). */
export interface ReviewItem {
  questionId: number;
  myIndex: number | null;
  correctIndex: number | null;
  correct: boolean;
}

/** Revansh holati: kutilmoqda / raqib taklif qildi / imkonsiz / javobsiz. */
export interface RematchState {
  status: "idle" | "waiting" | "offered" | "unavailable" | "timeout";
  reason?: string;
}

export type HistoryFilter = "ALL" | "WIN" | "LOSS" | "DRAW";

export interface UserStats {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
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
  isVip?: boolean;
  dailyMatchesLeft?: number;
  dailyLimit?: number;
}

export interface LeaderboardUser {
  position: number;
  rankPosition?: number;
  userId: string;
  name?: string;
  displayName: string;
  avatarUrl?: string | null;
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
  avatarUrl?: string | null;
  eloRating: number;
  rank: OctagonRankId;
  rankEmoji: string;
  rankName: string;
  wins?: number;
  totalMatches?: number;
  isOnline: boolean;
  status: "AVAILABLE" | "IN_MATCH" | "IN_QUEUE" | "OFFLINE" | string;
}

export interface GroupRoomMember {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
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
  opponentAvatarUrl?: string | null;
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
    avatarUrl?: string | null;
  };
  expiresInSec: number;
}

/** Biz yuborgan duel chaqiruvi (30 soniyalik kutish oynasi). */
export interface OutgoingChallenge {
  targetUserId: string;
  targetName: string;
  targetAvatar?: string | null;
  targetElo?: number;
  challengeId?: string;
  expiresInSec: number;
  /** waiting — javob kutilmoqda; rejected/timeout/error — yakunlandi (xabar ko'rsatiladi). */
  status: "sending" | "waiting" | "rejected" | "timeout" | "error";
  message?: string;
}

export interface GroupStanding {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  score: number;
  answeredCount: number;
}

