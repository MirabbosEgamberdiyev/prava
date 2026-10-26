import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import { useTariffPaywall } from "../../context/TariffPaywallContext";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
}

export const EXAM_OPTIONS = [20, 40, 50, 60, 80, 100];

export default function ExamPickerModal({ opened, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openPaywall } = useTariffPaywall();

  if (!opened) return null;

  const handleSelect = (count: number) => {
    if (user && !user.hasSubscription && user.remainingRealExamTrials === 0) {
      onClose();
      openPaywall(
        t(
          "exam.trialUsedReason",
          "Davlat imtihoni uchun 1 ta bepul sinov imtihonidan foydalangansiz. Cheksiz topshirish uchun tarifga obuna bo'ling"
        )
      );
      return;
    }
    onSelect(count);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card exam-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{t("exam.howManyQuestions")}</h3>

        {user?.hasSubscription ? (
          <div style={{ fontSize: 13, color: "#10b981", marginBottom: 12, textAlign: "center", fontWeight: 600 }}>
            ⭐ VIP Obuna: Cheksiz topshirish
          </div>
        ) : user?.remainingRealExamTrials === 0 ? (
          <div style={{ fontSize: 13, color: "#f59e0b", marginBottom: 12, textAlign: "center", fontWeight: 600 }}>
            🔒 Bepul sinov ishlatilgan — Tarifga obuna bo'ling
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#38bdf8", marginBottom: 12, textAlign: "center", fontWeight: 600 }}>
            🎁 1 ta bepul sinov imtihoni mavjud
          </div>
        )}

        <div className="exam-picker-grid">
          {EXAM_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className="exam-picker-btn"
              onClick={() => handleSelect(count)}
            >
              <span className="exam-picker-num">{count}</span>
              <span className="exam-picker-label">{t("exam.questionsUnit")}</span>
              <span className="exam-picker-time">{count} {t("exam.minuteShort")}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="modal-btn-cancel"
          style={{ width: "100%" }}
          onClick={onClose}
        >
          {t("common.cancel") || "Bekor qilish"}
        </button>
      </div>
    </div>
  );
}
