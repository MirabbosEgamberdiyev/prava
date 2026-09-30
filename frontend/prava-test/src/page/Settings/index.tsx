import { useState } from "react";
import { Modal, Switch } from "@mantine/core";
import {
  IconUser,
  IconLanguage,
  IconDatabase,
  IconInfoCircle,
  IconMoon,
  IconSun,
  IconArrowLeft,
  IconChevronRight,
  IconBell,
  IconDownload,
  IconMessageCircle,
  IconFileText,
  IconCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/notificationUtils";
import { ProfileInfoCard } from "../../features/me/components/ProfileInfoCard";
import { ChangePasswordForm } from "../../features/me/components/ChangePasswordForm";
import SEO from "../../components/common/SEO";
import { useLanguage, type AppLanguage } from "../../context/LanguageContext";
import { useDesktopTheme } from "../../context/DesktopThemeContext";
import OfflinePreparationModal from "../../components/offline/OfflinePreparationModal";
import TermsModal from "../../components/auth/TermsModal";

export default function Settings_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang, setLanguage } = useLanguage();
  const { theme, setTheme } = useDesktopTheme();

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  // Notification toggle
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem("prava_notifications_enabled") !== "false";
  });

  const toggleNotifications = (checked: boolean) => {
    setNotifications(checked);
    localStorage.setItem("prava_notifications_enabled", checked ? "true" : "false");
    showToast({
      id: "notifications-toggled",
      title: checked ? t("common.enabled", "Yoqildi") : t("common.disabled", "O'chirildi"),
      message: checked
        ? t("settings.notificationsOn", "Bildirishnomalar faollashtirildi")
        : t("settings.notificationsOff", "Bildirishnomalar o'chirildi"),
      color: checked ? "teal" : "gray",
    });
  };

  // Theme toggle
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  // Language display name
  const getLanguageLabel = () => {
    if (lang === "uzl") return "O'zbek (Lotin)";
    if (lang === "uzc") return "Ўзбек (Кирилл)";
    if (lang === "ru") return "Русский";
    return "O'zbek (Lotin)";
  };

  const onBack = () => navigate("/me");

  return (
    <>
      <SEO
        title={`${t("settings.title", "Sozlamalar")} - Prava Online`}
        description={t("settings.subtitle", "Ilova va hisob sozlamalari")}
        canonical="/settings"
      />

      <div className="ds-page-wrapper">
        <div className="ds-page-container" style={{ maxWidth: 680 }}>
          {/* Header */}
          <div className="ds-page-header">
            <div className="ds-header-left">
              <button
                type="button"
                className="ds-back-btn"
                onClick={onBack}
                aria-label={t("common.back", "Orqaga")}
              >
                <IconArrowLeft size={18} />
              </button>
              <div>
                <h1 className="ds-page-title">{t("settings.title", "Sozlamalar")}</h1>
              </div>
            </div>
          </div>

          {/* ── GROUP 1: Account ── */}
          <div className="ref-settings-section">
            <div className="ref-settings-section-title">
              {t("settings.sectionAccount", "Account")}
            </div>
            <div className="ref-settings-card">
              {/* Profil ma'lumotlari */}
              <div
                className="ref-settings-row"
                onClick={() => setProfileModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #0284c7, #2563eb)" }}
                  >
                    <IconUser size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.profileInfo", "Profil ma'lumotlari")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <IconChevronRight size={18} />
                </div>
              </div>

              {/* Til */}
              <div
                className="ref-settings-row"
                onClick={() => setLanguageModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
                  >
                    <IconLanguage size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.language", "Til")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <span>{getLanguageLabel()}</span>
                  <IconChevronRight size={18} />
                </div>
              </div>

              {/* Mavzu */}
              <div
                className="ref-settings-row"
                onClick={toggleTheme}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  >
                    {theme === "dark" ? <IconMoon size={20} /> : <IconSun size={20} />}
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.theme", "Mavzu")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <span>
                    {theme === "dark"
                      ? t("settings.themeTungi", "Tungi")
                      : t("settings.themeKunduzgi", "Kunduzgi")}
                  </span>
                  <IconChevronRight size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* ── GROUP 2: Ilova ── */}
          <div className="ref-settings-section">
            <div className="ref-settings-section-title">
              {t("settings.sectionApp", "Ilova")}
            </div>
            <div className="ref-settings-card">
              {/* Bildirishnomalar */}
              <div className="ref-settings-row" style={{ cursor: "default" }}>
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
                  >
                    <IconBell size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.notifications", "Bildirishnomalar")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <Switch
                    checked={notifications}
                    onChange={(e) => toggleNotifications(e.currentTarget.checked)}
                    size="md"
                    color="blue"
                  />
                </div>
              </div>

              {/* Ma'lumotlarni yuklab olish */}
              <div
                className="ref-settings-row"
                onClick={() => setOfflineModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    <IconDownload size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.downloadData", "Ma'lumotlarni yuklab olish")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <IconChevronRight size={18} />
                </div>
              </div>

              {/* Xotira boshqaruvi */}
              <div
                className="ref-settings-row"
                onClick={() => setStorageModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                  >
                    <IconDatabase size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.storageManagement", "Xotira boshqaruvi")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <IconChevronRight size={18} />
                </div>
              </div>

              {/* Ilova ma'lumotlari */}
              <div
                className="ref-settings-row"
                onClick={() => setAboutModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #64748b, #475569)" }}
                  >
                    <IconInfoCircle size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.appInfo", "Ilova ma'lumotlari")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <span>{t("settings.aboutVersionVal", "v2.0.0")}</span>
                  <IconChevronRight size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* ── GROUP 3: Yordam ── */}
          <div className="ref-settings-section">
            <div className="ref-settings-section-title">
              {t("settings.sectionHelp", "Yordam")}
            </div>
            <div className="ref-settings-card">
              {/* Biz bilan bog'lanish */}
              <a
                href="https://t.me/pravaonline_support"
                target="_blank"
                rel="noreferrer"
                className="ref-settings-row"
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
                  >
                    <IconMessageCircle size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.contactUs", "Biz bilan bog'lanish")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <IconChevronRight size={18} />
                </div>
              </a>

              {/* Foydalanish shartlari */}
              <div
                className="ref-settings-row"
                onClick={() => setTermsModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="ref-settings-row-left">
                  <div
                    className="ref-settings-row-icon"
                    style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
                  >
                    <IconFileText size={20} />
                  </div>
                  <span className="ref-settings-row-title">
                    {t("settings.termsOfService", "Foydalanish shartlari")}
                  </span>
                </div>
                <div className="ref-settings-row-right">
                  <IconChevronRight size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Profile Info Modal ── */}
        <Modal
          opened={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          title={t("settings.profileInfo", "Profil ma'lumotlari")}
          centered
          size="lg"
          radius="md"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ProfileInfoCard />
            <ChangePasswordForm />
          </div>
        </Modal>

        {/* ── Language Picker Modal ── */}
        <Modal
          opened={languageModalOpen}
          onClose={() => setLanguageModalOpen(false)}
          title={t("settings.language", "Tilni tanlang")}
          centered
          radius="md"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { code: "uzl", label: "O‘zbekcha (Lotin)" },
              { code: "uzc", label: "Ўзбекча (Кирилл)" },
              { code: "ru", label: "Русский" },
            ].map((item) => (
              <div
                key={item.code}
                className="ref-wrong-card"
                onClick={() => {
                  setLanguage(item.code as AppLanguage);
                  setLanguageModalOpen(false);
                }}
                style={{
                  padding: "14px 18px",
                  borderColor: lang === item.code ? "var(--g-primary-light)" : "var(--g-border)",
                  background: lang === item.code ? "rgba(2, 132, 199, 0.12)" : "var(--g-surface)",
                }}
              >
                <div style={{ flex: 1, fontWeight: 700, color: "var(--g-text)" }}>
                  {item.label}
                </div>
                {lang === item.code && (
                  <IconCheck size={18} style={{ color: "var(--g-primary-light)" }} />
                )}
              </div>
            ))}
          </div>
        </Modal>

        {/* ── Offline Dataset Preparation Modal ── */}
        <OfflinePreparationModal
          opened={offlineModalOpen}
          onClose={() => setOfflineModalOpen(false)}
        />

        {/* ── Storage Management Modal ── */}
        <Modal
          opened={storageModalOpen}
          onClose={() => setStorageModalOpen(false)}
          title={t("settings.storageManagement", "Xotira boshqaruvi")}
          centered
          radius="md"
        >
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: 13.5, color: "var(--g-text-muted)", marginBottom: 20 }}>
              {t("settings.storageDesc", "Offline saqlangan keshlar, rasmlar va lokal bazani boshqarish.")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--g-radius-md)",
                  background: "var(--g-surface-muted)",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--g-text)" }}>
                  {t("settings.storageLocalDB", "Lokal savollar bazasi")}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--g-primary-light)" }}>
                  1190 {t("common.questions", "ta savol")}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--g-radius-md)",
                  background: "var(--g-surface-muted)",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--g-text)" }}>
                  {t("settings.storageStatus", "Sinxron holati")}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--g-success)" }}>
                  {t("settings.storageSynced", "To'liq yangilangan")}
                </span>
              </div>
            </div>
          </div>
        </Modal>

        {/* ── About Modal ── */}
        <Modal
          opened={aboutModalOpen}
          onClose={() => setAboutModalOpen(false)}
          title={t("settings.appInfo", "Ilova ma'lumotlari")}
          centered
          radius="md"
        >
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <img src="/logo.png" width={48} height={48} alt="Prava" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--g-text)", margin: "0 0 4px" }}>
              PRAVA ONLINE
            </h3>
            <p style={{ fontSize: 13, color: "var(--g-primary-light)", fontWeight: 700, marginBottom: 16 }}>
              {t("settings.aboutVersionVal", "v2.0.0 Production Release (2026)")}
            </p>
            <p style={{ fontSize: 13.5, color: "var(--g-text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {t("settings.aboutAppDesc", "O'zbekiston Respublikasi Yo'l Harakati Qoidalarini o'rganish va YHXBB imtihonlariga tayyorlanish bo'yicha maxsus dasturiy ta'minot.")}
            </p>
            <div style={{ fontSize: 12, color: "var(--g-text-subtle)" }}>
              {t("settings.aboutCopyright", "© 2026 Prava Online. Barcha huquqlar himoyalangan.")}
            </div>
          </div>
        </Modal>

        {/* ── Terms of Service Modal ── */}
        <TermsModal
          opened={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          type="terms"
        />
      </div>
    </>
  );
}
