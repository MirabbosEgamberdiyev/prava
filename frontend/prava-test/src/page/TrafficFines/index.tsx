import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconClockHour4, IconInfoCircle, IconReportMoney } from "@tabler/icons-react";
import SEO from "../../components/common/SEO";
import { useLanguage } from "../../context/LanguageContext";
import { CurriculumSearch, CurriculumShell, CurriculumState } from "../../features/Curriculum/components/CurriculumShell";
import { useTrafficFines } from "../../features/Fines/useTrafficFines";
import { filterFines, pickFineText, type TrafficFine } from "../../services/finesService";
import { formatMultiplier, formatSom, formatSomRange } from "../../utils/formatMoney";
import { normalizeSearchText } from "../../utils/transliterate";
import "../../features/Fines/fines.css";

function FineRow({ fine, lang }: { fine: TrafficFine; lang: string }) {
  const { t } = useTranslation();
  const title = pickFineText(fine.title, lang);
  const sanction = pickFineText(fine.extraSanction, lang);
  const multiplier =
    fine.bhmMax != null
      ? `${formatMultiplier(fine.bhmMin, lang)}–${formatMultiplier(fine.bhmMax, lang)}`
      : formatMultiplier(fine.bhmMin, lang);
  return (
    <div className="fines-row" role="row">
      <span className="fines-article" role="cell">
        {fine.articleCode}
      </span>
      <span className="fines-title" role="cell">
        {title}
        {sanction && (
          <span className="fines-sanction">
            {t("fines.extraSanction", "Qo'shimcha jazo")}: {sanction}
          </span>
        )}
      </span>
      <span className="fines-amount" role="cell">
        <span className="fines-amount-sum">{formatSomRange(fine.amountMin ?? 0, fine.amountMax, lang)}</span>
        <span className="fines-amount-bhm">{t("fines.bhmMultiplier", { value: multiplier, defaultValue: "{{value}} BHM" })}</span>
      </span>
    </div>
  );
}

export default function TrafficFines_Page() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { data, error, isLoading, refresh, refreshing, savedAt, fromCache } = useTrafficFines();
  const fines = useMemo(() => data?.fines ?? [], [data]);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [params] = useSearchParams();
  const deepQ = params.get("q");
  useEffect(() => {
    if (deepQ) setSearch(deepQ);
  }, [deepQ]);

  const filtered = useMemo(() => filterFines(fines, search, normalizeSearchText), [fines, search]);
  const title = t("fines.title", "Yo'l harakati jarimalari");
  const subtitle = t("fines.subtitle", "");
  const noData = !!data && fines.length === 0;

  return (
    <>
      <SEO title={title} description={subtitle} canonical="/fines" noIndex />
      <CurriculumShell
        section="fines"
        title={title}
        subtitle={subtitle}
        badge={
          fines.length > 0 ? (
            <span className="cur-badge">
              <IconReportMoney size={14} /> {filtered.length} {t("fines.count", "ta modda")}
            </span>
          ) : undefined
        }
        savedAt={savedAt}
        fromCache={fromCache}
        refreshing={refreshing}
        onRefresh={refresh}
        searchRef={searchRef}
      >
        {data && (
          <p className="fines-bhm-note">
            <IconInfoCircle size={16} aria-hidden="true" />
            <span>
              {data.bhm.effectiveFrom
                ? t("fines.bhmNote", {
                    amount: formatSom(data.bhm.amount, lang),
                    date: data.bhm.effectiveFrom,
                    defaultValue: "1 BHM = {{amount}}, {{date}} dan",
                  })
                : t("fines.bhmNoteNoDate", { amount: formatSom(data.bhm.amount, lang), defaultValue: "1 BHM = {{amount}}" })}
            </span>
          </p>
        )}
        {noData ? (
          <div className="cur-empty fines-empty" role="status">
            <IconClockHour4 size={36} stroke={1.5} aria-hidden="true" />
            <p className="cur-empty-title">{t("fines.emptyTitle", "Jarimalar ro'yxati tez orada qo'shiladi")}</p>
            <p className="cur-empty-desc">{t("fines.emptyDesc", "")}</p>
          </div>
        ) : (
          <>
            <CurriculumSearch
              inputRef={searchRef}
              value={search}
              onChange={setSearch}
              placeholder={t("fines.searchPlaceholder", "Modda yoki qoidabuzarlik bo'yicha qidiring...")}
              resultCount={filtered.length}
            />
            <CurriculumState
              loading={isLoading}
              error={error}
              empty={filtered.length === 0}
              onRetry={refresh}
              emptyText={t("fines.noResults", "Mos keluvchi jarimalar topilmadi")}
              onClear={fines.length > 0 && search ? () => setSearch("") : undefined}
            >
              <div className="cur-panel">
                <div className="cur-panel-scroll">
                  <div className="fines-rows" role="table" aria-label={title}>
                    <div className="fines-row fines-row-head" role="row">
                      <span role="columnheader">{t("fines.colArticle", "Modda")}</span>
                      <span role="columnheader">{t("fines.colViolation", "Qoidabuzarlik")}</span>
                      <span role="columnheader">{t("fines.colAmount", "Jarima miqdori")}</span>
                    </div>
                    {filtered.map((f: TrafficFine) => (
                      <FineRow key={f.id} fine={f} lang={lang} />
                    ))}
                  </div>
                </div>
              </div>
            </CurriculumState>
          </>
        )}
      </CurriculumShell>
    </>
  );
}
