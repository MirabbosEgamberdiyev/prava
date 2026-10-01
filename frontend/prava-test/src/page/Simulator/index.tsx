import { Suspense, lazy, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isTauriRuntime } from "@/auth/runtime";
import { useAuth } from "@/auth/AuthContext";
import { useTariffPaywall } from "@/context/TariffPaywallContext";
import {
  IconArrowLeft,
  IconBrandWindows,
  IconBrandAndroid,
  IconBrandApple,
  IconBrandGooglePlay,
  IconDownload,
  IconCheck,
  IconCpu,
  IconSparkles,
  IconDeviceGamepad2,
  IconWifiOff,
  IconSteeringWheel,
  IconCar,
  IconExternalLink,
} from "@tabler/icons-react";
import SEO from "@/components/common/SEO";
import "./simulator-promo.css";

const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";

// Lazy load the heavy 3D simulator only in Tauri desktop runtime
const SimulatorBoundary = lazy(() => import("@/simulator/SimulatorBoundary"));
const SimulatorScreen = lazy(() => import("@/simulator/SimulatorScreen"));

/**
 * Web View: Dedicated Promo & Download Page
 * Informs users that full 3D simulation with 60 FPS and physics requires Desktop or Mobile app.
 */
function SimulatorWebPromo() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/me");
    }
  };

  return (
    <div className="sim-promo-wrapper">
      <SEO
        title={t("simulator.promo.seoTitle", "3D Avtodrom Simulyatori — Prava Online")}
        description={t(
          "simulator.promo.seoDesc",
          "Avtodromda haydash simulyatoridan to'liq foydalanish uchun Prava Online Desktop yoki Mobil versiyasini yuklab oling."
        )}
      />

      <div className="sim-promo-container">
        {/* Navigation Bar */}
        <header className="sim-promo-header">
          <button type="button" className="sim-promo-back-btn" onClick={handleBack}>
            <IconArrowLeft size={18} stroke={2} />
            <span>{t("common.back", "Orqaga")}</span>
          </button>
        </header>

        {/* Hero Section */}
        <section className="sim-promo-hero">
          <div className="sim-promo-hero-content">
            <div className="sim-promo-badge">
              <IconSparkles size={14} />
              <span>{t("simulator.promo.badge", "3D Avtodrom Simulyatori")}</span>
            </div>
            <h1 className="sim-promo-title">
              {t("simulator.promo.title", "Avtodromda haydash simulyatori")}
            </h1>
            <p className="sim-promo-subtitle">
              {t(
                "simulator.promo.lead",
                "3D Simulyatordan to‘liq, silliq va yuqori unumdorlikda (60 FPS) foydalanish uchun Prava Online Desktop (Windows) yoki Mobil versiyasini yuklab oling!"
              )}
            </p>
            <div className="sim-promo-hero-cta">
              <a href={WINDOWS_DIRECT_URL} download className="sim-hero-btn-primary">
                <IconBrandWindows size={20} />
                <span>{t("simulator.promo.downloadWindows", "Windows uchun yuklab olish (.exe)")}</span>
                <IconDownload size={18} />
              </a>
              <button
                type="button"
                className="sim-hero-btn-secondary"
                onClick={() => navigate("/downloads")}
              >
                <span>{t("simulator.promo.allDownloads", "Barcha versiyalar")}</span>
                <IconExternalLink size={17} />
              </button>
            </div>
          </div>

          <div className="sim-promo-hero-graphic">
            <img
              src="/simulator/car-card.webp"
              alt="3D Simulator Car"
              className="sim-promo-car-img"
              loading="eager"
            />
          </div>
        </section>

        {/* Platforms Grid */}
        <section className="sim-platforms-section">
          <h2 className="sim-section-heading">
            <IconCar size={24} color="#818cf8" />
            <span>{t("simulator.promo.choosePlatform", "Qurilmangizni tanlang")}</span>
          </h2>

          <div className="sim-platforms-grid">
            {/* Windows Desktop */}
            <div className="sim-platform-card is-featured">
              <div>
                <div className="sim-card-header">
                  <div className="sim-card-icon-box">
                    <IconBrandWindows size={28} />
                  </div>
                  <span className="sim-card-badge badge-blue">
                    {t("simulator.promo.recommended", "Tavsiya etiladi")}
                  </span>
                </div>
                <h3 className="sim-card-title">Windows Desktop</h3>
                <div className="sim-card-specs">Windows 10 / 11 (64-bit) • 60 FPS Engine</div>
                <ul className="sim-card-features">
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>To‘liq 3D Avtodrom va real avtomobil fizikasi</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Rul chambaragi, geympad va klaviatura bilan boshqarish</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Internet talab qilmaydigan 100% oflayn rejim</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Ultra HD grafika va 0ms minimal kechikish</span>
                  </li>
                </ul>
              </div>
              <a href={WINDOWS_DIRECT_URL} download className="sim-card-btn btn-primary">
                <IconDownload size={18} />
                <span>{t("simulator.promo.downloadExe", "O‘rnatish (.exe)")}</span>
              </a>
            </div>

            {/* Android Mobile */}
            <div className="sim-platform-card">
              <div>
                <div className="sim-card-header">
                  <div className="sim-card-icon-box">
                    <IconBrandAndroid size={28} />
                  </div>
                  <span className="sim-card-badge badge-green">
                    {t("simulator.promo.mobileApp", "Mobil ilova")}
                  </span>
                </div>
                <h3 className="sim-card-title">Android Ilova</h3>
                <div className="sim-card-specs">Android 8.0+ • Google Play & APK</div>
                <ul className="sim-card-features">
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Istalgan joyda smartfonda mashq qilish</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Sensorli virtual rul va boshqaruv pedallari</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Google Play orqali avtomatik yangilanish</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>To‘g‘ridan-to‘g‘ri APK orqali tezkor o‘rnatish</span>
                  </li>
                </ul>
              </div>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sim-card-btn btn-secondary"
              >
                <IconBrandGooglePlay size={18} />
                <span>Google Play</span>
              </a>
            </div>

            {/* iOS / Apple */}
            <div className="sim-platform-card">
              <div>
                <div className="sim-card-header">
                  <div className="sim-card-icon-box">
                    <IconBrandApple size={28} />
                  </div>
                  <span className="sim-card-badge badge-purple">
                    {t("simulator.promo.appleDevice", "iPhone & iPad")}
                  </span>
                </div>
                <h3 className="sim-card-title">iOS / iPadOS</h3>
                <div className="sim-card-specs">iOS 15.0+ • iPhone va iPad</div>
                <ul className="sim-card-features">
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Metal grafik tezlatgich bilan silliq kadrlar</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>iPhone va iPad ekranlariga moslashtirilgan interfeys</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>Apple ID orqali natijalarni sinxronlashtirish</span>
                  </li>
                  <li>
                    <IconCheck size={17} className="sim-check-icon" />
                    <span>App Store rasmiy do‘koni orqali himoyalangan</span>
                  </li>
                </ul>
              </div>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sim-card-btn btn-secondary"
              >
                <IconBrandApple size={18} />
                <span>App Store</span>
              </a>
            </div>
          </div>
        </section>

        {/* Why Desktop / Features Grid */}
        <section className="sim-features-section">
          <h2 className="sim-section-heading">
            <IconSparkles size={24} color="#38bdf8" />
            <span>{t("simulator.promo.whyDesktop", "Nega alohida dasturda foydalanish tavsiya etiladi?")}</span>
          </h2>

          <div className="sim-features-grid">
            <div className="sim-feature-box">
              <div className="sim-feature-icon">
                <IconCpu size={22} />
              </div>
              <h4 className="sim-feature-title">
                {t("simulator.promo.feature1Title", "To‘liq GPU tezlanishi")}
              </h4>
              <p className="sim-feature-desc">
                {t(
                  "simulator.promo.feature1Desc",
                  "Brauzer cheklovlarisiz to‘liq video karta kuchidan foydalanadi va silliq 60 FPS beradi."
                )}
              </p>
            </div>

            <div className="sim-feature-box">
              <div className="sim-feature-icon">
                <IconSteeringWheel size={22} />
              </div>
              <h4 className="sim-feature-title">
                {t("simulator.promo.feature2Title", "Rul va Geympad")}
              </h4>
              <p className="sim-feature-desc">
                {t(
                  "simulator.promo.feature2Desc",
                  "Logitech, Thrustmaster va geympadlarni ulab, haqiqiy mashinadagidek his eting."
                )}
              </p>
            </div>

            <div className="sim-feature-box">
              <div className="sim-feature-icon">
                <IconWifiOff size={22} />
              </div>
              <h4 className="sim-feature-title">
                {t("simulator.promo.feature3Title", "Oflayn ishlash")}
              </h4>
              <p className="sim-feature-desc">
                {t(
                  "simulator.promo.feature3Desc",
                  "Bir marta yuklab oling va internetsiz ham barcha avtodrom mashqlarini bajaring."
                )}
              </p>
            </div>

            <div className="sim-feature-box">
              <div className="sim-feature-icon">
                <IconDeviceGamepad2 size={22} />
              </div>
              <h4 className="sim-feature-title">
                {t("simulator.promo.feature4Title", "100% Imtihon Standartlari")}
              </h4>
              <p className="sim-feature-desc">
                {t(
                  "simulator.promo.feature4Desc",
                  "YHXX amaliy imtihon avtodromining estakada, parallel parkovka va garaj mashqlari nusxasi."
                )}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Desktop Tauri View: Runs interactive 3D Simulator
 */
function SimulatorTauriView() {
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
      navigate("/me");
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

export default function SimulatorDashboard_Page() {
  if (isTauriRuntime()) {
    return <SimulatorTauriView />;
  }
  return <SimulatorWebPromo />;
}
