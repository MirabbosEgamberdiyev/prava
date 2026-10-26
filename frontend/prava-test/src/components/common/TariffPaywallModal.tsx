import { useState, useEffect } from "react";
import {
  IconX,
  IconShieldCheck,
  IconSparkles,
  IconBolt,
  IconSwords,
  IconCar,
  IconClock,
  IconFlame,
  IconCrown,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTariffPaywall } from "../../context/TariffPaywallContext";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { paymentApi } from "../../payment/paymentApi";

interface PlanOption {
  id: "1d" | "1w" | "2w" | "1m" | "3m" | "6m" | "1y";
  days: number;
  price: number;
  daily: number;
  packageId: number;
  discount?: number;
  badge?: "popular" | "discount" | "new";
}

const PLANS: PlanOption[] = [
  { id: "1d", days: 1, price: 5000, daily: 5000, packageId: 7, badge: "new" },
  { id: "1w", days: 7, price: 19000, daily: 2714, packageId: 1 },
  { id: "2w", days: 14, price: 29000, daily: 2071, packageId: 2, discount: 25 },
  { id: "1m", days: 30, price: 45000, daily: 1500, packageId: 3, discount: 45, badge: "popular" },
  { id: "3m", days: 90, price: 89000, daily: 988, packageId: 4, discount: 65 },
  { id: "6m", days: 180, price: 139000, daily: 772, packageId: 5, discount: 70 },
  { id: "1y", days: 365, price: 199000, daily: 545, packageId: 6, discount: 80, badge: "discount" },
];

export default function TariffPaywallModal() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { isOpen, reason, closePaywall } = useTariffPaywall();
  const counts = useCurriculumCounts();

  const [selectedPlanId, setSelectedPlanId] = useState<PlanOption["id"]>("1m");
  const [loadingProvider, setLoadingProvider] = useState<"inpay" | "click" | "payme" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.setAttribute("data-modal-open", "true");
    return () => {
      document.documentElement.removeAttribute("data-modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[3];
  const ticketsDisplay = counts.tickets > 0 ? String(counts.tickets) : "70";
  const questionsDisplay =
    counts.questions > 0
      ? new Intl.NumberFormat(i18n.language).format(counts.questions)
      : "1 243";

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat(i18n.language).format(n) + " " + t("payment.currency", "so'm");
  };

  const handlePay = async (provider: "inpay" | "click" | "payme") => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      closePaywall();
      openAuthModal({ returnUrl: "/packages" });
      return;
    }
    setLoadingProvider(provider);
    try {
      const res =
        provider === "inpay"
          ? await paymentApi.createInPayInvoice(selectedPlan.packageId)
          : provider === "click"
          ? await paymentApi.createClickInvoice(selectedPlan.packageId)
          : await paymentApi.createPaymeInvoice(selectedPlan.packageId);

      if (res && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          t("errors.serverError", "To'lov tizimiga ulanishda xatolik yuz berdi")
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={closePaywall}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.76)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: 24,
          width: 860,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          boxShadow: "0 25px 65px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)",
          position: "relative",
          border: "1px solid var(--border, #e2e8f0)",
          padding: "32px 30px 28px",
        }}
      >
        {/* Yopish tugmasi */}
        <button
          onClick={closePaywall}
          aria-label={t("common.close", "Yopish")}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            zIndex: 2,
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "var(--card-bg, #ffffff)",
            border: "1.5px solid var(--border, #e2e8f0)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted, #64748b)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#0284c7";
            e.currentTarget.style.color = "#0284c7";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border, #e2e8f0)";
            e.currentTarget.style.color = "var(--text-muted, #64748b)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <IconX size={18} stroke={2.4} />
        </button>

        {/* Sarlavha bloki */}
        <div style={{ textAlign: "center", marginBottom: 22, paddingRight: 24, paddingLeft: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "#0284c7",
              background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
              border: "1px solid rgba(14, 165, 233, 0.28)",
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            <IconSparkles size={14} />
            <span>{reason || t("tariff.badge", "Premium Obuna")}</span>
          </div>

          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: -0.4,
              color: "var(--text, #0f172a)",
            }}
          >
            {t("tariff.heading", "Barcha imkoniyatlar va 3D Avtodromni oching")}
          </h2>

          <p
            style={{
              margin: "0 auto",
              maxWidth: 620,
              fontSize: 14,
              color: "var(--text-muted, #64748b)",
              lineHeight: 1.5,
            }}
          >
            {t(
              "tariff.subtitle",
              "50 ta bilet bepul. Qolgan biletlar, OKTAGON cheksiz janglari va 3D Avtodrom uchun qulay muddatni tanlang."
            )}
          </p>
        </div>

        {/* 7-Reja Tanlov Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(102px, 1fr))",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {PLANS.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const name = t(`tariff.plans.${plan.id}.name`, plan.id);
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                role="button"
                tabIndex={0}
                style={{
                  position: "relative",
                  background: isSelected
                    ? "linear-gradient(180deg, rgba(14, 165, 233, 0.09) 0%, rgba(14, 165, 233, 0.03) 100%)"
                    : "var(--bg, #f8fafc)",
                  border: isSelected
                    ? "2px solid #0284c7"
                    : "1.5px solid var(--border, #e2e8f0)",
                  borderRadius: 15,
                  padding: "16px 6px 14px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  userSelect: "none",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(2, 132, 199, 0.18), 0 8px 20px rgba(2, 132, 199, 0.12)"
                    : "none",
                  transform: isSelected ? "translateY(-2px)" : "none",
                }}
              >
                {plan.badge === "popular" && (
                  <div
                    style={{
                      position: "absolute",
                      top: -9,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(245, 158, 11, 0.35)",
                    }}
                  >
                    {t("tariff.popular", "⭐ TOP")}
                  </div>
                )}
                {plan.badge === "new" && (
                  <div
                    style={{
                      position: "absolute",
                      top: -9,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(6, 182, 212, 0.35)",
                    }}
                  >
                    {t("tariff.newBadge", "YANGI")}
                  </div>
                )}
                {plan.discount && (
                  <div
                    style={{
                      position: "absolute",
                      top: -9,
                      right: 6,
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      boxShadow: "0 2px 6px rgba(16, 185, 129, 0.35)",
                    }}
                  >
                    -{plan.discount}%
                  </div>
                )}

                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "var(--text, #0f172a)",
                    marginBottom: 3,
                  }}
                >
                  {name}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: isSelected ? "#0284c7" : "var(--text, #0f172a)",
                    marginBottom: 3,
                  }}
                >
                  {formatMoney(plan.price)}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-muted, #64748b)",
                  }}
                >
                  {t("tariff.perDay", {
                    amount: new Intl.NumberFormat(i18n.language).format(plan.daily),
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 6 ta asosiy qulayliklar paneli */}
        <div
          style={{
            background: "var(--bg, #f8fafc)",
            borderRadius: 16,
            padding: "16px 20px",
            border: "1px solid var(--border, #e2e8f0)",
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "10px 16px",
          }}
        >
          {/* 1. Biletlar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(2, 132, 199, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconCar size={17} color="#0284c7" stroke={2.2} />
            </div>
            <span>
              <strong>{t("tariff.compare.tickets", "Biletlar")}:</strong>{" "}
              {t("tariff.compare.ticketsPro", { tickets: ticketsDisplay })}
            </span>
          </div>

          {/* 2. OKTAGON */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconSwords size={17} color="#ef4444" stroke={2.2} />
            </div>
            <span>
              <strong>{t("tariff.compare.octagon", "OKTAGON")}:</strong>{" "}
              {t("tariff.compare.octagonPro", "Cheksiz janglar & VIP status")}
            </span>
          </div>

          {/* 3. Real Imtihon */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(245, 158, 11, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconClock size={17} color="#f59e0b" stroke={2.2} />
            </div>
            <span>
              <strong>{t("tariff.compare.realExam", "Davlat imtihoni")}:</strong>{" "}
              {t("tariff.compare.realExamPro", "Cheksiz sinov imtihonlari")}
            </span>
          </div>

          {/* 4. 3D Avtodrom */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(139, 92, 246, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconCrown size={17} color="#8b5cf6" stroke={2.2} />
            </div>
            <span>
              <strong>3D Avtodrom:</strong>{" "}
              {t("tariff.compare.simulatorPro", "Barcha mashqlar to'liq ochiq")}
            </span>
          </div>

          {/* 5. Xatolar ustida ishlash */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(16, 185, 129, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconShieldCheck size={17} color="#10b981" stroke={2.2} />
            </div>
            <span>
              <strong>Xatolar tahlili:</strong>{" "}
              {t("tariff.compare.mistakesPro", "Xato qilingan savollar tahlili")}
            </span>
          </div>

          {/* 6. Marafon */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(249, 115, 22, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconFlame size={17} color="#f97316" stroke={2.2} />
            </div>
            <span>
              <strong>Marafon:</strong>{" "}
              {t("tariff.compare.marathonPro", { questions: questionsDisplay })}
            </span>
          </div>
        </div>

        {/* To'lov va buyurtma paneli */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            background: "var(--card-bg, #ffffff)",
            padding: "18px 22px",
            borderRadius: 18,
            border: "1.5px solid var(--border, #e2e8f0)",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Narx va reja nomi */}
          <div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-muted, #64748b)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                marginBottom: 2,
              }}
            >
              {t(`tariff.plans.${selectedPlan.id}.name`)} — {t(`tariff.plans.${selectedPlan.id}.desc`)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 900,
                  color: "#0284c7",
                  letterSpacing: -0.6,
                }}
              >
                {formatMoney(selectedPlan.price)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
                ({t("tariff.perDay", {
                  amount: new Intl.NumberFormat(i18n.language).format(selectedPlan.daily),
                })})
              </div>
            </div>
          </div>

          {/* To'lov tugmalari: inPAY (asosiy/tavsiya), Click, Payme */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* inPAY (Tavsiya etiladi) */}
            <button
              type="button"
              onClick={() => handlePay("inpay")}
              disabled={loadingProvider !== null}
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loadingProvider !== null ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                opacity: loadingProvider !== null ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (loadingProvider === null) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.48)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(99, 102, 241, 0.35)";
              }}
            >
              <IconSparkles size={16} />
              <span>
                {loadingProvider === "inpay"
                  ? t("common.loading", "Yuklanmoqda...")
                  : t("tariff.payWithInpay", "inPAY (Click, Payme, Uzcard, Humo)")}
              </span>
            </button>

            {/* Click */}
            <button
              type="button"
              onClick={() => handlePay("click")}
              disabled={loadingProvider !== null}
              style={{
                background: "#0073ff",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 700,
                cursor: loadingProvider !== null ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(0, 115, 255, 0.28)",
                opacity: loadingProvider !== null ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (loadingProvider === null) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <IconBolt size={16} />
              <span>
                {loadingProvider === "click"
                  ? t("common.loading", "Yuklanmoqda...")
                  : t("tariff.payWithClick", "Click")}
              </span>
            </button>

            {/* Payme */}
            <button
              type="button"
              onClick={() => handlePay("payme")}
              disabled={loadingProvider !== null}
              style={{
                background: "#00cccc",
                color: "#064040",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 800,
                cursor: loadingProvider !== null ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(0, 204, 204, 0.28)",
                opacity: loadingProvider !== null ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (loadingProvider === null) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <IconBolt size={16} />
              <span>
                {loadingProvider === "payme"
                  ? t("common.loading", "Yuklanmoqda...")
                  : t("tariff.payWithPayme", "Payme")}
              </span>
            </button>
          </div>
        </div>

        {/* Xatolik xabari */}
        {errorMsg && (
          <div
            style={{
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              textAlign: "center",
              marginTop: 12,
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Ishonch va xavfsizlik nishonlari */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            fontSize: 12,
            color: "var(--text-muted, #64748b)",
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <IconShieldCheck size={15} color="#10b981" />
            <span>{t("tariff.safePayment", "SSL 256-bit xavfsiz to'lov")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <IconBolt size={15} color="#0284c7" />
            <span>{t("tariff.instantActivation", "Darhol faollashadi")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <IconCrown size={15} color="#f59e0b" />
            <span>{t("tariff.officialBase", "Rasmiy 2026 YHQ bazasi")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
