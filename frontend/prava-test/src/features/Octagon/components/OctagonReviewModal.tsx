import React from "react";
import { Modal } from "@mantine/core";
import { IconCheck, IconX, IconListCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OctagonQuestion, QuestionOptionItem, ReviewItem } from "../types";
import "../octagon.css";

interface Props {
  opened: boolean;
  onClose: () => void;
  review: ReviewItem[];
  questions: OctagonQuestion[];
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function pick(lang: string, uzl?: string, uzc?: string, ru?: string, fallback?: string): string {
  if (lang === "ru") return ru || fallback || uzl || "";
  if (lang === "uzc") return uzc || fallback || uzl || "";
  return uzl || fallback || "";
}

/**
 * "Jang tahlili": har savol bo'yicha mening javobim va to'g'ri variant. To'g'ri javoblar faqat jang
 * tugagach server yuborgan `review`dan olinadi — jang davomida klientda bo'lmaydi.
 */
export const OctagonReviewModal: React.FC<Props> = ({ opened, onClose, review, questions }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "uzl";
  const byId = new Map(questions.map((q) => [q.id, q]));
  const optionText = (q: OctagonQuestion | undefined, idx: number | null): string => {
    if (!q || idx === null || idx === undefined) return "";
    const opt: QuestionOptionItem | undefined = q.options[idx];
    return opt ? pick(lang, opt.textUzl, opt.textUzc, opt.textRu, opt.text) : "";
  };
  const correctCount = review.filter((r) => r.correct).length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      closeButtonProps={{ "aria-label": t("common.close") }}
      centered
      size="lg"
      radius="lg"
      padding="lg"
      overlayProps={{ backgroundOpacity: 0.7, blur: 4 }}
      classNames={{ content: "oct-modal-dark", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
      title={
        <span className="oct-modal-title">
          <span className="oct-modal-title-icon green">
            <IconListCheck size={20} />
          </span>
          {t("octagon.review.title")}
        </span>
      }
    >
      <p className="oct-review-summary">{t("octagon.review.summary", { correct: correctCount, total: review.length })}</p>
      <ol className="oct-review-list">
        {review.map((r, i) => {
          const q = byId.get(r.questionId);
          const text = q ? pick(lang, q.textUzl, q.textUzc, q.textRu, q.text) : "";
          const kind = r.myIndex === null || r.myIndex === undefined ? "skipped" : r.correct ? "right" : "wrong";
          return (
            <li key={r.questionId} className={`oct-review-item ${kind}`}>
              <div className="oct-review-head">
                <span className="oct-review-num">{i + 1}</span>
                <span className={`oct-review-mark ${kind}`} aria-label={t(`octagon.review.${kind}`)}>
                  {kind === "right" ? <IconCheck size={16} stroke={3} /> : <IconX size={16} stroke={3} />}
                </span>
                <span className="oct-review-q">{text || t("octagon.review.questionN", { n: i + 1 })}</span>
              </div>
              <div className="oct-review-answers">
                {kind === "skipped" ? (
                  <div className="oct-review-line muted">{t("octagon.review.notAnswered")}</div>
                ) : (
                  <div className={`oct-review-line ${kind === "right" ? "right" : "wrong"}`}>
                    <b>{t("octagon.review.yourAnswer")}</b> {LETTERS[r.myIndex as number]}. {optionText(q, r.myIndex)}
                  </div>
                )}
                {kind !== "right" && r.correctIndex !== null && (
                  <div className="oct-review-line right">
                    <b>{t("octagon.review.correctAnswer")}</b> {LETTERS[r.correctIndex]}. {optionText(q, r.correctIndex)}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
};
