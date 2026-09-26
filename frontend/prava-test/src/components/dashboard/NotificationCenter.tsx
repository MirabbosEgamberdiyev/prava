import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Menu, Badge } from "@mantine/core";
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconTrash,
  IconBellRinging,
  IconSparkles,
  IconFlame,
  IconTarget,
  IconInfoCircle,
} from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

export interface InAppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "reminder" | "streak";
}

const STORAGE_KEY = "prava_inapp_notifications_v2";

// v1 held hardcoded demo notifications — dropped so users never see fake entries.
const LEGACY_STORAGE_KEYS = ["prava_inapp_notifications_v1"];

function loadNotifications(): InAppNotification[] {
  try {
    LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as InAppNotification[];
    }
  } catch {
    // ignore
  }
  return [];
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<InAppNotification[]>(loadNotifications);

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Persist notifications on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleToggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleRequestBrowserPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === "granted") {
          new Notification("PravaOnline", {
            body: t("notifications.browserEnabledBody", "Brauzer bildirishnomalari muvaffaqiyatli yoqildi!"),
            icon: "/logo.svg",
          });
        }
      } catch {}
    }
  }, [t]);

  const handleSendTestNotification = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(t("notifications.testTitle", "PravaOnline — Eslatma"), {
        body: t("notifications.testBody", "Bugungi mashg'ulotni boshlash vaqti bo'ldi!"),
        icon: "/logo.svg",
      });
    }
  }, [t]);

  const renderIcon = (type: InAppNotification["type"]) => {
    switch (type) {
      case "streak":
        return <IconFlame size={16} color="#f59e0b" />;
      case "reminder":
        return <IconTarget size={16} color="#0284c7" />;
      case "success":
        return <IconSparkles size={16} color="#10b981" />;
      default:
        return <IconInfoCircle size={16} color="#6366f1" />;
    }
  };

  return (
    <Menu shadow="xl" width={340} position="bottom-end" radius="md" closeOnItemClick={false}>
      <Menu.Target>
        <button
          type="button"
          className={styles.notificationBtn}
          aria-label={t("dashboard.notificationsTitle", "Bildirishnomalar")}
          title={t("dashboard.notificationsTitle", "Bildirishnomalar")}
        >
          <IconBell size={19} stroke={1.8} />
          {unreadCount > 0 && (
            <span className={styles.notificationBadge} aria-label={t("notifications.unreadCount", "{{count}} ta o'qilmagan", { count: unreadCount })}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Menu.Target>

      <Menu.Dropdown style={{ padding: 0, maxHeight: 480, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {t("dashboard.notificationsTitle", "Bildirishnomalar")}
            </span>
            {unreadCount > 0 && (
              <Badge size="xs" color="blue" variant="filled">
                {unreadCount} {t("dashboard.unread", "yangi")}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--primary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 6px",
                borderRadius: 6,
              }}
              title={t("notifications.markAllRead", "Barchasini o'qilgan deb belgilash")}
            >
              <IconChecks size={15} />
              <span>{t("notifications.markAllReadShort", "Barchasi o'qildi")}</span>
            </button>
          )}
        </div>

        {/* Browser Permission Banner */}
        {typeof window !== "undefined" && "Notification" in window && browserPermission !== "granted" && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(2, 132, 199, 0.08)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconBellRinging size={18} color="#0284c7" />
              <span style={{ fontSize: 11.5, color: "var(--text)", fontWeight: 500 }}>
                {t("notifications.enableBrowser", "Brauzer bildirishnomalari")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRequestBrowserPermission}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                background: "#0284c7",
                color: "#ffffff",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t("notifications.allow", "Yoqish")}
            </button>
          </div>
        )}

        {/* If granted, optional mini test trigger */}
        {typeof window !== "undefined" && "Notification" in window && browserPermission === "granted" && (
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(16, 185, 129, 0.06)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <IconCheck size={13} /> {t("notifications.browserActive", "Brauzer xabarlari faol")}
            </span>
            <button
              type="button"
              onClick={handleSendTestNotification}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 10.5,
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {t("notifications.sendTest", "Test xabar")}
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div style={{ flex: 1, overflowY: "auto", maxHeight: 320, padding: "6px 0" }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
              <IconBell size={32} stroke={1.5} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>
                {t("notifications.empty", "Hozircha hech qanday bildirishnoma yo'q")}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleToggleRead(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleToggleRead(n.id)}
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                  background: n.read ? "transparent" : "rgba(2, 132, 199, 0.05)",
                  borderBottom: "1px solid var(--border)",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--surface-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {renderIcon(n.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: n.read ? 600 : 700,
                        color: "var(--text)",
                      }}
                    >
                      {n.title}
                    </span>
                    {!n.read && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#0284c7",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: "3px 0 4px",
                      fontSize: 11.5,
                      color: "var(--text-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.description}
                  </p>
                  <span style={{ fontSize: 10.5, color: "var(--text-muted)", opacity: 0.8 }}>
                    {n.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              background: "var(--surface)",
            }}
          >
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 11,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IconTrash size={13} />
              <span>{t("notifications.clearAll", "Tozalash")}</span>
            </button>
          </div>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
