import React, { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { useOctagonStore } from "../../features/Octagon/useOctagonStore";
import { OctagonLobbyView } from "../../features/Octagon/components/OctagonLobbyView";
import { OctagonRadarView } from "../../features/Octagon/components/OctagonRadarView";
import { OctagonArenaView } from "../../features/Octagon/components/OctagonArenaView";
import { OctagonResultView } from "../../features/Octagon/components/OctagonResultView";
import { OctagonRulesModal } from "../../features/Octagon/components/OctagonRulesModal";
import { OctagonAuthGateModal } from "../../features/Octagon/components/OctagonAuthGateModal";
import { OctagonLeaderboardModal } from "../../features/Octagon/components/OctagonLeaderboardModal";
import { OctagonDuelModal } from "../../features/Octagon/components/OctagonDuelModal";
import { OctagonHistoryModal } from "../../features/Octagon/components/OctagonHistoryModal";
import { OctagonGroupModal } from "../../features/Octagon/components/OctagonGroupModal";
import { OctagonChallengeToast } from "../../features/Octagon/components/OctagonChallengeToast";
import { rankFromElo, safeName } from "../../features/Octagon/rank";
import "../../features/Octagon/octagon.css";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

const OctagonPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [searchParams, setSearchParams] = useSearchParams();
  // pravaonline.uz/oktagon?code=4821 (yangi havola) yoki eski ?duel=KOD
  const duelParam = searchParams.get("code") || searchParams.get("duel");

  const {
    state,
    matchId,
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
  } = useOctagonStore(user);

  // Mehmon Oktagon'ni ochganda — bir marta kirish oynasi (jang tugmalari ham uni qayta ochadi)
  const gateShownRef = useRef(false);
  useEffect(() => {
    if (!user && !gateShownRef.current) {
      gateShownRef.current = true;
      setShowAuthGate(true);
    }
    if (user) setShowAuthGate(false);
  }, [user, setShowAuthGate]);

  // ?code=1234 — havola/QR orqali kelgan do'st jangi: kod avtomatik kiritiladi
  // (kirgandan keyin ham shu manzilga qaytiladi)
  const handledDuelRef = useRef<string | null>(null);
  useEffect(() => {
    if (!duelParam || !user || state !== "IDLE" || handledDuelRef.current === duelParam) return;
    handledDuelRef.current = duelParam;
    void joinInvite(duelParam);
    const next = new URLSearchParams(searchParams);
    next.delete("code");
    next.delete("duel");
    setSearchParams(next, { replace: true });
  }, [duelParam, user, state, joinInvite, searchParams, setSearchParams]);

  const handleLogin = useCallback(() => {
    setShowAuthGate(false);
    const returnUrl = duelParam ? `/octagon?code=${encodeURIComponent(duelParam)}` : "/octagon";
    openAuthModal({ returnUrl });
  }, [openAuthModal, duelParam, setShowAuthGate]);

  const myDisplayName = user
    ? safeName([user.firstName, user.lastName].filter(Boolean).join(" ") || myStats?.displayName, t("octagon.lobby.defaultUser"))
    : t("octagon.lobby.guest");
  const myElo = myStats?.eloRating ?? 0;
  const myRank = rankFromElo(myElo);
  const myAvatar = myStats?.avatarUrl ?? null;

  return (
    <div style={{ width: "100%", minHeight: "calc(100vh - 70px)", background: "#060b13", position: "relative" }}>
      <SEO
        title={`${t("octagon.lobby.title")} - Prava Online`}
        description={t("octagon.lobby.tagline")}
        canonical="/octagon"
      />

      {(state === "IDLE" || state === "AUTH_CHECK") && (
        <OctagonLobbyView
          user={user}
          displayName={myDisplayName}
          stats={myStats}
          onStartSearch={startSearch}
          onOpenDuel={openDuel}
          onOpenGroup={openGroup}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenHistory={openHistory}
          onOpenRules={() => setShowRulesModal(true)}
          onLogin={handleLogin}
        />
      )}

      {state === "SEARCHING" && <OctagonRadarView searchSeconds={searchSeconds} onCancel={cancelSearch} />}

      {(state === "MATCH_FOUND" || state === "COUNTDOWN" || state === "PLAYING" || state === "RECONNECTING") && (
        <OctagonArenaView
          state={state}
          countdown={countdown}
          remainingTimeSec={remainingTimeSec}
          myScore={myScore}
          myName={myDisplayName}
          myRank={myRank}
          myElo={myElo}
          myAvatar={myAvatar}
          opponent={opponent}
          reconnecting={reconnecting}
          oppProgress={oppProgress}
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          myAnsweredCount={Object.keys(myAnswers).length}
          myAnswerIndex={currentQuestion ? myAnswers[currentQuestion.id] : undefined}
          flyingEmojis={flyingEmojis}
          onSubmitAnswer={submitAnswer}
          onSendReaction={sendReaction}
        />
      )}

      {state === "MATCH_FINISHED" && (
        <OctagonResultView
          matchId={matchId}
          result={matchResult}
          myName={myDisplayName}
          myAvatar={myAvatar}
          myUserId={user ? String(user.id) : undefined}
          opponent={opponent}
          standings={roomStandings}
          revengeRequested={revengeRequested}
          onRequestRevenge={requestRevenge}
          onReturnToLobby={returnToLobby}
        />
      )}

      <OctagonRulesModal opened={showRulesModal} onConfirm={confirmRulesAndSearch} onClose={() => setShowRulesModal(false)} />

      <OctagonAuthGateModal opened={showAuthGate && !user} onLogin={handleLogin} onClose={() => setShowAuthGate(false)} />

      <OctagonLeaderboardModal opened={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      <OctagonDuelModal
        opened={showDuelModal}
        onClose={() => {
          if (outgoingChallenge?.status === "waiting" || outgoingChallenge?.status === "sending") cancelChallenge();
          else clearOutgoing();
          setShowDuelModal(false);
        }}
        onJoinInvite={joinInvite}
        inviteJoin={inviteJoin}
        onResetInviteJoin={resetInviteJoin}
        onSendChallenge={sendChallenge}
        onCancelChallenge={cancelChallenge}
        onClearOutgoing={clearOutgoing}
        outgoing={outgoingChallenge}
      />

      <OctagonGroupModal
        opened={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        currentUserId={user ? String(user.id) : ""}
        currentRoom={currentRoom}
        errorMessage={roomErrorMessage}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLeaveRoom={leaveRoom}
        onToggleReady={toggleReady}
        onStartRoomGame={startRoomGame}
      />

      <OctagonHistoryModal opened={showHistoryModal} onClose={() => setShowHistoryModal(false)} />

      <OctagonChallengeToast challenge={incomingChallenge} onAccept={acceptChallenge} onReject={rejectChallenge} />
    </div>
  );
};

export default OctagonPage;
