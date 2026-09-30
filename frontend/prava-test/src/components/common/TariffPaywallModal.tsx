import { useState } from "react";
import {
  IconX,
  IconCheck,
  IconShieldCheck,
  IconSparkles,
  IconBolt,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTariffPaywall } from "../../context/TariffPaywallContext";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { paymentApi } from "../../payment/paymentApi";

interface PlanOption {
  id: "1w" | "2w" | "1m" | "3m" | "6m" | "1y";
  days: number;
  price: number;
  daily: number;
  packageId: number;
  discount?: number;
  badge?: "popular" | "discount";
}

const PLANS: PlanOption[] = [
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
  const [loadingProvider, setLoadingProvider] = useState<"click" | "payme" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[2];
  const ticketsDisplay = counts.tickets > 0 ? String(counts.tickets) : "70";

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat(i18n.language).format(n) + " " + t("payment.currency", "so'm");
  };

  const handlePay = async (provider: "click" | "payme") => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      closePaywall();
      openAuthModal({ returnUrl: "/packages" });
      return;
    }
    setLoadingProvider(provider);
    try {
      const res =
        provider === "click"
          ? await paymentApi.createClickInvoice(selectedPlan.packageId)
          : await paymentApi.createPaymeInvoice(selectedPlan.packageId);

      if (res && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || t("errors.serverError", "To'lov tizimiga ulanishda xatolik yuz berdi"));
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
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg, #ffffff)",
          borderRadius: 24,
          width: 820,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          position: "relative",
          border: "1px solid var(--border, #e2e8f0)",
          padding: "36px 32px 32px",
        }}
      >
        <button
          onClick={closePaywall}
          aria-label={t("common.close", "Yopish")}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border, #e2e8f0)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted, #64748b)",
          }}
        >
          <IconX size={18} stroke={2.2} />
        </button>

        {/* Sarlavha */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: "#0284c7",
              background: "rgba(14, 165, 233, 0.12)",
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            <IconSparkles size={14} />
            <span>{reason || t("tariff.badge", "Premium")}</span>
          </div>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: -0.3,
              color: "var(--text, #0f172a)",
            }}
          >
            {t("tariff.heading", "Barcha imkoniyatlarni va 3D Avtodromni oching")}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text-muted, #64748b)",
              lineHeight: 1.5,
            }}
          >
            {t("tariff.subtitle", "50 ta bilet bepul. Qolgan biletlar va 3D Avtodrom uchun qulay muddatni tanlang.")}
          </p>
        </div>

        {/* 6-Plan Duration Selector */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
            gap: 8,
            marginBottom: 24,
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
                  background: isSelected ? "rgba(14, 165, 233, 0.08)" : "var(--bg, #f8fafc)",
                  border: isSelected ? "2px solid #0284c7" : "1.5px solid var(--border, #e2e8f0)",
                  borderRadius: 14,
                  padding: "14px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
              >
                {plan.badge === "popular" && (
                  <div
                    style={{
                      position: "absolute",
                      top: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#f59e0b",
                      color: "#fff",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("tariff.popular", "⭐ TOP")}
                  </div>
                )}
                {plan.discount && (
                  <div
                    style={{
                      position: "absolute",
                      top: -8,
                      right: 4,
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "#10b981",
                      color: "#fff",
                    }}
                  >
                    -{plan.discount}%
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text, #0f172a)", marginBottom: 2 }}>
                  {name}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0284c7", marginBottom: 2 }}>
                  {formatMoney(plan.price)}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted, #64748b)" }}>
                  {t("tariff.perDay", { amount: new Intl.NumberFormat(i18n.language).format(plan.daily) })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Grid */}
        <div
          style={{
            background: "var(--bg, #f8fafc)",
            borderRadius: 16,
            padding: "16px 20px",
            border: "1px solid var(--border, #e2e8f0)",
            marginBottom: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <IconCheck size={16} color="#10b981" stroke={3} />
            <span>{t("tariff.compare.ticketsPro", { tickets: ticketsDisplay })}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <IconCheck size={16} color="#10b981" stroke={3} />
            <span>{t("tariff.compare.simulatorPro", "3D Avtodrom to'liq ochiq")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <IconCheck size={16} color="#10b981" stroke={3} />
            <span>{t("tariff.compare.mistakesPro", "Xatolar ustida ishlash")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <IconCheck size={16} color="#10b981" stroke={3} />
            <span>{t("tariff.compare.realExamPro", "Cheksiz real imtihon sinovlari")}</span>
          </div>
        </div>

        {/* Checkout Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            background: "var(--card-bg, #ffffff)",
            padding: "16px 20px",
            borderRadius: 16,
            border: "1.5px solid var(--border, #e2e8f0)",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted, #64748b)", fontWeight: 600 }}>
              {t(`tariff.plans.${selectedPlan.id}.name`)} — {t(`tariff.plans.${selectedPlan.id}.desc`)}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#0284c7" }}>
              {formatMoney(selectedPlan.price)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => handlePay("click")}
              disabled={loadingProvider !== null}
              style={{
                background: "#0073ff",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconBolt size={16} />
              <span>{loadingProvider === "click" ? t("common.loading", "Yuklanmoqda...") : t("tariff.payWithClick", "Click")}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePay("payme")}
              disabled={loadingProvider !== null}
              style={{
                background: "#00cccc",
                color: "#064040",
                border: "none",
                borderRadius: 12,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <IconBolt size={16} />
              <span>{loadingProvider === "payme" ? t("common.loading", "Yuklanmoqda...") : t("tariff.payWithPayme", "Payme")}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginTop: 10 }}>
            {errorMsg}
          </div>
        )}

        {/* Ishonch qatori */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontSize: 12,
            color: "var(--text-muted, #64748b)",
            marginTop: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconShieldCheck size={14} color="#10b981" />
            <span>{t("tariff.safePayment", "SSL xavfsiz to'lov")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconBolt size={14} color="#0284c7" />
            <span>{t("tariff.instantActivation", "Darhol faollashadi")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
