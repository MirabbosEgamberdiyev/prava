import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useOctagonStore } from "../../features/Octagon/useOctagonStore";
import { OctagonLobbyView } from "../../features/Octagon/components/OctagonLobbyView";
import { OctagonRadarView } from "../../features/Octagon/components/OctagonRadarView";
import { OctagonArenaView } from "../../features/Octagon/components/OctagonArenaView";
import { OctagonResultView } from "../../features/Octagon/components/OctagonResultView";
import { OctagonRulesModal } from "../../features/Octagon/components/OctagonRulesModal";
import { OctagonGuestModal } from "../../features/Octagon/components/OctagonGuestModal";
import { OctagonLeaderboardModal } from "../../features/Octagon/components/OctagonLeaderboardModal";
import { OctagonDuelModal } from "../../features/Octagon/components/OctagonDuelModal";
import "../../features/Octagon/octagon.css";

const OctagonPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const duelParam = searchParams.get("duel");

  const {
    state,
    myStats,
    searchSeconds,
    countdown,
    remainingTimeSec,
    opponent,
    currentQuestion,
    currentIndex,
    totalQuestions,
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
  } = useOctagonStore(user);

  // Auto-trigger duel challenge if ?duel=CODE is present in URL
  useEffect(() => {
    if (duelParam && state === "IDLE") {
      confirmRulesAndSearch(duelParam);
    }
  }, [duelParam, state, confirmRulesAndSearch]);

  const guestNickname = typeof window !== "undefined"
    ? localStorage.getItem("octagon_guest_nickname") || undefined
    : undefined;

  const myDisplayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Haydovchi"
    : guestNickname || "Mehmon";

  const myRank = myStats?.rank || "bronze";

  return (
    <div style={{ width: "100%", minHeight: "calc(100vh - 70px)", background: "#060b13", position: "relative" }}>

      {/* 1. LOBBY VIEW */}
      {(state === "IDLE" || state === "AUTH_CHECK") && (
        <OctagonLobbyView
          user={user}
          guestNickname={guestNickname}
          stats={myStats}
          onStartSearch={startSearch}
          onOpenDuel={() => setShowDuelModal(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenRules={() => setShowRulesModal(true)}
        />
      )}

      {/* 2. RADAR VIEW */}
      {state === "SEARCHING" && (
        <OctagonRadarView
          searchSeconds={searchSeconds}
          onCancel={cancelSearch}
        />
      )}

      {/* 3. ARENA VIEW (MATCH_FOUND / COUNTDOWN / PLAYING / RECONNECTING) */}
      {(state === "MATCH_FOUND" || state === "COUNTDOWN" || state === "PLAYING" || state === "RECONNECTING") && (
        <OctagonArenaView
          state={state}
          countdown={countdown}
          remainingTimeSec={remainingTimeSec}
          myScore={myScore}
          myName={myDisplayName}
          myRank={myRank}
          opponent={opponent}
          oppProgress={oppProgress}
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          myAnswerIndex={currentQuestion ? myAnswers[currentQuestion.id] : undefined}
          flyingEmojis={flyingEmojis}
          onSubmitAnswer={submitAnswer}
          onSendReaction={sendReaction}
        />
      )}

      {/* 4. RESULT VIEW */}
      {state === "MATCH_FINISHED" && (
        <OctagonResultView
          result={matchResult}
          myName={myDisplayName}
          opponent={opponent}
          revengeRequested={revengeRequested}
          onRequestRevenge={requestRevenge}
          onReturnToLobby={returnToLobby}
        />
      )}

      {/* MODALS */}
      <OctagonRulesModal
        opened={showRulesModal}
        onConfirm={confirmRulesAndSearch}
        onClose={() => setShowRulesModal(false)}
      />

      <OctagonGuestModal
        opened={showGuestModal}
        onContinueAsGuest={() => {
          setShowGuestModal(false);
          confirmRulesAndSearch();
        }}
        onClose={() => setShowGuestModal(false)}
      />

      <OctagonLeaderboardModal
        opened={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <OctagonDuelModal
        opened={showDuelModal}
        onClose={() => setShowDuelModal(false)}
        onStartDuel={(code) => {
          setShowDuelModal(false);
          confirmRulesAndSearch(code);
        }}
      />
    </div>
  );
};

export default OctagonPage;
