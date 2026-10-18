import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

/**
 * Dinamik Shaxsiy Watermark (Anti-Scraping & Screenshot Trace)
 * Tizimga kirgan foydalanuvchi bilet, mavzu yoki imtihon yechayotganda ekranning ustiga
 * yarim shaffof (opacity 0.08-0.10) diagonal shaxsiy iz muhrlaydi:
 * ID: {user.id} • {user.phone} • {vaqt}
 * pointer-events: none — test ishlashga xalaqit bermaydi.
 */
export const DynamicWatermark = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState<string>(() => formatTime(new Date()));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 30_000); // har 30 sekundda vaqtni yangilash

    return () => clearInterval(timer);
  }, []);

  // Faqat autentifikatsiyalangan foydalanuvchilar uchun
  const shouldRender = isAuthenticated && user && Boolean(user.id);

  const watermarkText = useMemo(() => {
    if (!user) return "";
    let phone = user.phoneNumber || user.email || "";
    if (phone && !phone.startsWith("+") && !phone.includes("@")) {
      phone = `+${phone}`;
    }
    return `ID: ${user.id} | ${phone} | pravaonline.uz`;
  }, [user]);

  if (!shouldRender) {
    return null;
  }

  // Sahifani to'liq qoplab turuvchi ko'p martalik diagonal izlar
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
        userSelect: "none",
        opacity: 0.08,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gridAutoRows: "180px",
        alignItems: "center",
        justifyItems: "center",
        transform: "rotate(-22deg) scale(1.3)",
        transformOrigin: "center center",
      }}
    >
      {Array.from({ length: 48 }).map((_, idx) => (
        <div
          key={idx}
          style={{
            fontFamily: "monospace, system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            color: "currentColor",
            whiteSpace: "nowrap",
            textShadow: "0 0 1px rgba(0,0,0,0.2)",
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};

function formatTime(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default DynamicWatermark;
