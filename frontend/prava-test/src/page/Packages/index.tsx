import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { paymentApi } from "../../payment/paymentApi";
import api from "../../api/api";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconCrown,
  IconShieldCheck,
  IconSparkles,
  IconBolt,
} from "@tabler/icons-react";
import "../../styles/packages-page.css";

interface PlanOption {
  id: "1w" | "2w" | "1m" | "3m" | "6m" | "1y";
  days: number;
  price: number;
  daily: number;
  packageId: number;
  discount?: number;
  badge?: "popular" | "discount";
}

const DEFAULT_PLANS: PlanOption[] = [
  { id: "1w", days: 7, price: 19000, daily: 2714, packageId: 1 },
  { id: "2w", days: 14, price: 29000, daily: 2071, packageId: 2, discount: 25 },
  { id: "1m", days: 30, price: 45000, daily: 1500, packageId: 3, discount: 45, badge: "popular" },
  { id: "3m", days: 90, price: 89000, daily: 988, packageId: 4, discount: 65 },
  { id: "6m", days: 180, price: 139000, daily: 772, packageId: 5, discount: 70 },
  { id: "1y", days: 365, price: 199000, daily: 545, packageId: 6, discount: 80, badge: "discount" },
];

export default function Packages_Page() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const counts = useCurriculumCounts();

  const [plans, setPlans] = useState<PlanOption[]>(DEFAULT_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanOption["id"]>("1m");
  const [loadingProvider, setLoadingProvider] = useState<"click" | "payme" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<{ data: { content?: any[] } }>("/api/v1/packages")
      .then((res) => {
        if (!mounted) return;
        const content = res.data?.data?.content;
        if (Array.isArray(content) && content.length > 0) {
          setPlans((prev) =>
            prev.map((pl) => {
              const matched = content.find(
                (c: any) =>
                  c.id === pl.packageId ||
                  (c.name && c.name.toLowerCase().includes(pl.id === "1w" ? "1 hafta" : pl.id === "2w" ? "2 hafta" : pl.id === "1m" ? "1 oy" : pl.id === "3m" ? "3 oy" : pl.id === "6m" ? "6 oy" : "1 yil"))
              );
              if (matched && typeof matched.price === "number") {
                return {
                  ...pl,
                  packageId: matched.id ?? pl.packageId,
                  price: matched.price,
                  daily: Math.round(matched.price / pl.days),
                };
              }
              return pl;
            })
          );
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[2];

  const ticketsDisplay = counts.tickets > 0 ? String(counts.tickets) : "64";
  const questionsDisplay = counts.questions > 0 ? new Intl.NumberFormat(i18n.language).format(counts.questions) : "1 243";

  const formatMoney = (n: number) => {
    return new Intl.NumberFormat(i18n.language).format(n) + " " + t("payment.currency", "so'm");
  };

  const handlePay = async (provider: "click" | "payme") => {
    setErrorMsg(null);
    if (!isAuthenticated) {
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
    <>
      <SEO
        title={`${t("packages.title", "Paketlar")} - Prava Online`}
        description={t("tariff.subtitle", "50 ta bilet bepul. Qolgan biletlar va 3D Avtodrom uchun qulay muddatni tanlang.")}
        canonical="/packages"
      />

      <div className="ds-page-wrapper">
        <div className="po-pricing-wrapper">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <button
              type="button"
              className="ds-back-btn"
              onClick={() => navigate("/me")}
              aria-label={t("common.back", "Orqaga")}
            >
              <IconArrowLeft size={18} />
            </button>
          </div>

          <div className="po-pricing-header">
            <div className="po-pricing-badge">
              <IconSparkles size={14} />
              <span>{t("tariff.badge", "Premium")}</span>
            </div>
            <h1 className="po-pricing-title">{t("tariff.heading", "Barcha imkoniyatlarni va 3D Avtodromni oching")}</h1>
            <p className="po-pricing-subtitle">{t("tariff.subtitle", "50 ta bilet bepul. Qolgan biletlar va 3D Avtodrom uchun qulay muddatni tanlang.")}</p>
          </div>

          {/* 6-Plan Duration Selector */}
          <div className="po-durations-grid">
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              const name = t(`tariff.plans.${plan.id}.name`, plan.id);
              return (
                <div
                  key={plan.id}
                  className={`po-duration-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedPlanId(plan.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedPlanId(plan.id);
                  }}
                  aria-pressed={isSelected}
                >
                  {plan.badge === "popular" && (
                    <div className="po-card-badge popular">{t("tariff.popular", "Eng ommabop ⭐")}</div>
                  )}
                  {plan.badge === "discount" && (
                    <div className="po-card-badge discount">{t("tariff.savePercent", { percent: plan.discount })}</div>
                  )}
                  {!plan.badge && plan.discount && (
                    <div className="po-card-badge discount">-{plan.discount}%</div>
                  )}

                  <div className="po-duration-name">{name}</div>
                  <div className="po-duration-price">{formatMoney(plan.price)}</div>
                  <div className="po-duration-perDay">
                    {t("tariff.perDay", { amount: new Intl.NumberFormat(i18n.language).format(plan.daily) })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="po-compare-card">
            <table className="po-compare-table">
              <thead>
                <tr>
                  <th className="po-compare-th feature-col">{t("tariff.compare.feature", "Imkoniyat")}</th>
                  <th className="po-compare-th free-col">{t("tariff.compare.freeCol", "Bepul")}</th>
                  <th className="po-compare-th pro-col">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <IconCrown size={16} />
                      {t(`tariff.plans.${selectedPlan.id}.name`)} ({formatMoney(selectedPlan.price)})
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Tickets */}
                <tr className="po-compare-row">
                  <td className="po-compare-td feature-title">{t("tariff.compare.tickets", "Biletlar")}</td>
                  <td className="po-compare-td free-val">{t("tariff.compare.ticketsFree", "1–50 biletlar (bepul)")}</td>
                  <td className="po-compare-td pro-val">
                    <span className="po-val-badge open">
                      <IconCheck size={16} stroke={2.5} />
                      {t("tariff.compare.ticketsPro", { tickets: ticketsDisplay })}
                    </span>
                  </td>
                </tr>

                {/* 2. 3D Avtodrom Simulator */}
                <tr className="po-compare-row">
                  <td className="po-compare-td feature-title">{t("tariff.compare.simulator", "3D Avtodrom simulyatori")}</td>
                  <td className="po-compare-td free-val">
                    <span className="po-val-badge locked">
                      <IconX size={16} stroke={2.5} />
                      {t("tariff.compare.simulatorFree", "Yopiq")}
                    </span>
                  </td>
                  <td className="po-compare-td pro-val">
                    <span className="po-val-badge open">
                      <IconCheck size={16} stroke={2.5} />
                      {t("tariff.compare.simulatorPro", "To'liq ochiq (barcha mashqlar)")}
                    </span>
                  </td>
                </tr>

                {/* 3. Mistakes Review */}
                <tr className="po-compare-row">
                  <td className="po-compare-td feature-title">{t("tariff.compare.mistakes", "Xatolar ustida ishlash")}</td>
                  <td className="po-compare-td free-val">
                    <span className="po-val-badge locked">
                      <IconX size={16} stroke={2.5} />
                      {t("tariff.compare.mistakesFree", "Mavjud emas")}
                    </span>
                  </td>
                  <td className="po-compare-td pro-val">
                    <span className="po-val-badge open">
                      <IconCheck size={16} stroke={2.5} />
                      {t("tariff.compare.mistakesPro", "Xato qilingan savollar tahlili")}
                    </span>
                  </td>
                </tr>

                {/* 4. Questions Marathon */}
                <tr className="po-compare-row">
                  <td className="po-compare-td feature-title">{t("tariff.compare.marathon", "Savollar marafoni")}</td>
                  <td className="po-compare-td free-val">
                    <span className="po-val-badge locked">
                      <IconX size={16} stroke={2.5} />
                      {t("tariff.compare.marathonFree", "Mavjud emas")}
                    </span>
                  </td>
                  <td className="po-compare-td pro-val">
                    <span className="po-val-badge open">
                      <IconCheck size={16} stroke={2.5} />
                      {t("tariff.compare.marathonPro", { questions: questionsDisplay })}
                    </span>
                  </td>
                </tr>

                {/* 5. Real Exam Simulation */}
                <tr className="po-compare-row">
                  <td className="po-compare-td feature-title">{t("tariff.compare.realExam", "Real YHXB imtihon sinovi")}</td>
                  <td className="po-compare-td free-val">{t("tariff.compare.realExamFree", "Cheklangan")}</td>
                  <td className="po-compare-td pro-val">
                    <span className="po-val-badge open">
                      <IconCheck size={16} stroke={2.5} />
                      {t("tariff.compare.realExamPro", "Cheksiz sinov imtihonlari")}
                    </span>
                  </td>
                </tr>

                {/* 6. Offline Mode */}
                <tr className="po-compare-row">
                  <td className="po-compare-td feature-title">{t("tariff.compare.offline", "Oflayn rejim (internetsiz)")}</td>
                  <td className="po-compare-td free-val">
                    <span className="po-val-badge locked">
                      <IconX size={16} stroke={2.5} />
                      {t("tariff.compare.offlineFree", "Mavjud emas")}
                    </span>
                  </td>
                  <td className="po-compare-td pro-val">
                    <span className="po-val-badge open">
                      <IconCheck size={16} stroke={2.5} />
                      {t("tariff.compare.offlinePro", "Desktop va Mobilda to'liq oflayn")}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Checkout Bar */}
          <div className="po-checkout-card">
            <div className="po-checkout-left">
              <div className="po-checkout-label">
                {t(`tariff.plans.${selectedPlan.id}.name`)} — {t(`tariff.plans.${selectedPlan.id}.desc`)}
              </div>
              <div className="po-checkout-sum">{formatMoney(selectedPlan.price)}</div>
            </div>

            <div className="po-checkout-actions">
              <button
                type="button"
                className="po-btn-click"
                onClick={() => handlePay("click")}
                disabled={loadingProvider !== null}
              >
                <IconBolt size={18} />
                <span>{loadingProvider === "click" ? t("common.loading", "Yuklanmoqda...") : t("tariff.payWithClick", "Click orqali to'lash")}</span>
              </button>

              <button
                type="button"
                className="po-btn-payme"
                onClick={() => handlePay("payme")}
                disabled={loadingProvider !== null}
              >
                <IconBolt size={18} />
                <span>{loadingProvider === "payme" ? t("common.loading", "Yuklanmoqda...") : t("tariff.payWithPayme", "Payme orqali to'lash")}</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: "#ef4444", fontSize: 13.5, textAlign: "center", marginTop: 12 }}>
              {errorMsg}
            </div>
          )}

          {/* Trust Badges */}
          <div className="po-trust-row">
            <div className="po-trust-item">
              <IconShieldCheck size={16} color="#10b981" />
              <span>{t("tariff.safePayment", "Xavfsiz to'lov (SSL)")}</span>
            </div>
            <div className="po-trust-item">
              <IconBolt size={16} color="#0284c7" />
              <span>{t("tariff.instantActivation", "Darhol faollashadi")}</span>
            </div>
            <div className="po-trust-item">
              <IconCrown size={16} color="#f59e0b" />
              <span>{t("tariff.officialBase", "Rasmiy 2026 YHQ bazasi")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
