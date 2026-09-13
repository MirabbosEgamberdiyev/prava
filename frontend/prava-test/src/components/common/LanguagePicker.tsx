import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export const LANGUAGES = [
  { code: "uzl", label: "O‘zbekcha (Lotin)" },
  { code: "uzc", label: "Ўзбекча (Кирилл)" },
  { code: "ru", label: "Русский" },
];

export default function LanguagePicker() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLang = i18n.language || "uzl";
  const current = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("prava_lang", code);
      localStorage.setItem("i18nextLng", code);
      document.cookie = `i18next=${code}; path=/; max-age=31536000`;
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <div className="lang-picker" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen((o) => !o)} type="button">
        <span className="lang-btn-label">{current.label}</span>
        <span className="lang-btn-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`lang-option${lang.code === currentLang ? " active" : ""}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
