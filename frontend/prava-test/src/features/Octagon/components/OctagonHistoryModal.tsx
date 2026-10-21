import React, { useState, useEffect } from "react";
import { Modal } from "@mantine/core";
import { IconHistory, IconArrowLeft, IconArrowRight, IconSwords } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { MatchHistoryEntry } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { safeName } from "../rank";
import { formatMatchDate } from "../arena";
import "../octagon.css";

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Bo'sh tarix: "Birinchi jangni boshlang" tugmasi (tasodifiy raqib qidiruvi). */
  onStartBattle?: () => void;
}

export const OctagonHistoryModal: React.FC<Props> = ({ opened, onClose, onStartBattle }) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [historyList, setHistoryList] = useState<MatchHistoryEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!opened) return;
    let alive = true;
    setLoading(true);
    setFailed(false);
    OctagonApi.getHistory(page, 10)
      .then((res) => {
        if (!alive) return;
        const items = res?.content || (Array.isArray(res) ? res : []);
        setHistoryList(items);
        setTotalPages(res?.totalPages || 1);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [opened, page]);

  const lang = i18n.language || "uzl";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      radius="lg"
      padding="lg"
      overlayProps={{ backgroundOpacity: 0.7, blur: 4 }}
      classNames={{ content: "oct-modal-dark", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
      title={
        <span className="oct-modal-title">
          <span className="oct-modal-title-icon green">
            <IconHistory size={20} />
          </span>
          {t("octagon.history.title")}
        </span>
      }
    >
      {loading ? (
        <div aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="oct-skel oct-skel-row" />
          ))}
        </div>
      ) : failed ? (
        <div className="oct-empty">{t("octagon.common.error")}</div>
      ) : historyList.length === 0 ? (
        <div className="oct-empty">
          <div className="oct-empty-icon">⚔️</div>
          <div className="oct-empty-text">{t("octagon.history.emptyCta")}</div>
          {onStartBattle && (
            <button
              type="button"
              className="oct-3d-btn green oct-empty-btn"
              onClick={() => {
                onClose();
                onStartBattle();
              }}
            >
              <IconSwords size={20} stroke={2.5} />
              <span>{t("octagon.history.startFirst")}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="oct-history-list">
          {historyList.map((m) => {
            const kind = m.result === "WIN" ? "win" : m.result === "DRAW" ? "draw" : "loss";
            const name = safeName(m.opponentName, t("octagon.history.opponent"));
            return (
              <div key={m.matchId} className={`oct-history-card ${kind}`}>
                <OctagonAvatar name={name} src={m.opponentAvatarUrl} size={42} />
                <div className="oct-history-main">
                  <div className="oct-history-name">{name}</div>
                  <div className="oct-history-date">{formatMatchDate(m.createdAt, lang)}</div>
                </div>
                <div className="oct-history-score">
                  <span className="oct-history-score-num">
                    {m.myScore} : {m.opponentScore}
                  </span>
                  <span className={`oct-history-result ${kind}`}>
                    {kind === "win"
                      ? t("octagon.history.win")
                      : kind === "draw"
                      ? t("octagon.history.draw")
                      : t("octagon.history.loss")}
                  </span>
                </div>
                <div className={`oct-history-elo ${m.deltaElo > 0 ? "up" : m.deltaElo < 0 ? "down" : ""}`}>
                  {m.deltaElo > 0 ? `+${m.deltaElo}` : m.deltaElo} ELO
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="oct-pager">
          <button
            type="button"
            className="oct-pager-btn"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <IconArrowLeft size={14} /> {t("octagon.history.prev")}
          </button>
          <span className="oct-pager-info">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="oct-pager-btn"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("octagon.history.next")} <IconArrowRight size={14} />
          </button>
        </div>
      )}
    </Modal>
  );
};
