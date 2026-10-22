import React, { useState, useEffect } from "react";
import { Modal } from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import "../octagon.css";

interface Props {
  opened: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Qoidalar server bilan bir xil: 10 savol / 300 s, ko'proq to'g'ri javob — g'alaba, teng — durang, 6 liga, 350 ms, 45 s. */
const RULES = [
  { icon: "⏱️", tone: "blue", key: "battle" },
  { icon: "🏆", tone: "green", key: "win" },
  { icon: "⭐", tone: "gold", key: "elo" },
  { icon: "🛡️", tone: "purple", key: "fair" },
] as const;

export const OctagonRulesModal: React.FC<Props> = ({ opened, onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    if (!opened) {
      setSecondsLeft(4);
      return;
    }

    setSecondsLeft(4);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      closeButtonProps={{ "aria-label": t("common.close") }}
      centered
      radius="lg"
      padding="lg"
      overlayProps={{ backgroundOpacity: 0.7, blur: 4 }}
      classNames={{ content: "oct-modal-dark", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
      title={
        <span className="oct-modal-title">
          <span className="oct-modal-title-icon orange">
            <IconShieldCheck size={20} />
          </span>
          {t("octagon.rules.title")}
        </span>
      }
    >
      <p className="oct-rules-subtitle">{t("octagon.rules.subtitle")}</p>

      <div className="oct-rules-list">
        {RULES.map((r) => (
          <div key={r.key} className={`oct-rule-card ${r.tone}`}>
            <span className="oct-rule-icon" aria-hidden="true">
              {r.icon}
            </span>
            <div>
              <div className="oct-rule-title">{t(`octagon.rules.${r.key}Title`)}</div>
              <div className="oct-rule-desc">{t(`octagon.rules.${r.key}Desc`)}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={secondsLeft > 0}
        onClick={onConfirm}
        className={`oct-3d-btn green oct-rules-confirm ${secondsLeft > 0 ? "waiting" : ""}`}
      >
        {secondsLeft > 0 ? t("octagon.rules.waitCountdown", { sec: secondsLeft }) : t("octagon.rules.understand")}
      </button>
    </Modal>
  );
};
