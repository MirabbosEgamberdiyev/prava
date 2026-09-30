import { Suspense, lazy, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SimulatorBoundary from "@/simulator/SimulatorBoundary";
import { useAuth } from "@/auth/AuthContext";
import { useTariffPaywall } from "@/context/TariffPaywallContext";
import { useTranslation } from "react-i18next";

const SimulatorScreen = lazy(() => import("@/simulator/SimulatorScreen"));

export default function SimulatorDashboard_Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openPaywall } = useTariffPaywall();
  const { t } = useTranslation();

  const isSubscribed = Boolean((user as any)?.hasSubscription || (user as any)?.packageActive);

  useEffect(() => {
    if (!isSubscribed) {
      openPaywall(t("tariff.compare.simulatorPro", "3D Avtodrom simulyatori to'liq ochiq"));
    }
  }, [isSubscribed, openPaywall, t]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/practical-exam");
    }
  };

  if (!isSubscribed) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1a24",
          color: "#e9eef2",
          gap: 16,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
          {t("tariff.compare.simulator", "3D Avtodrom simulyatori")}
        </h2>
        <p style={{ color: "#94a3b8", maxWidth: 440, margin: 0, fontSize: 15 }}>
          {t("tariff.subtitle", "50 ta bilet bepul. Qolgan biletlar va 3D Avtodrom uchun qulay muddatni tanlang.")}
        </p>
        <button
          type="button"
          onClick={() => openPaywall(t("tariff.compare.simulatorPro", "3D Avtodrom simulyatori to'liq ochiq"))}
          style={{
            background: "#0284c7",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          {t("packages.title", "Paketlar")}
        </button>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b1a24",
            color: "#e9eef2",
            gap: 16,
          }}
        >
          <div className="spinner" />
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Avtodrom yuklanmoqda...</span>
        </div>
      }
    >
      <SimulatorBoundary onBack={handleBack}>
        <SimulatorScreen onBack={handleBack} />
      </SimulatorBoundary>
    </Suspense>
  );
}
