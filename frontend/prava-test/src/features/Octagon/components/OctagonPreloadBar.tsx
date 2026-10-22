import React, { useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { imagePreloader } from "../OctagonImagePreloader";
import { preloadProgress } from "../arena";
import "../octagon.css";

interface Props {
  /** Jangdagi savollar rasmlari (rasmsiz savol — null). */
  paths: Array<string | null | undefined>;
}

const subscribe = (cb: () => void) => imagePreloader.subscribe(cb);

/** VS ekrani: 10 ta savol rasmi haqiqatda qancha yuklangani (preloader holatidan). */
export const OctagonPreloadBar: React.FC<Props> = ({ paths }) => {
  const { t } = useTranslation();
  // Snapshot — satr (barqaror solishtirish): har rasm holati yoki "-" (rasm yo'q)
  const getSnapshot = useCallback(() => paths.map((p) => (p ? imagePreloader.getStatus(p) : "-")).join(","), [paths]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const statuses = snapshot ? snapshot.split(",").map((s) => (s === "-" ? null : (s as "idle" | "loading" | "ready" | "error"))) : [];
  const { done, total, pct } = preloadProgress(statuses);

  return (
    <div className="oct-preload" aria-live="polite">
      <div className="oct-preload-head">
        <span>{t("octagon.arena.preloadingDesc")}</span>
        <span className="oct-preload-count">{total > 0 ? `${done}/${total}` : ""}</span>
      </div>
      <div className="oct-preload-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="oct-preload-fill" style={{ width: `${total > 0 ? pct : 8}%` }} />
      </div>
    </div>
  );
};
