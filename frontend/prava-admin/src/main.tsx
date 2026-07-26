import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";
import "./utils/i18n.ts";

import { Notifications, notifications } from "@mantine/notifications";
import { SWRConfig } from "swr";
import api from "./services/api.ts";
import { ModalsProvider } from "@mantine/modals";
import i18n from "./utils/i18n.ts";

// Global API error handler for 403/500
window.addEventListener("api-error", ((e: CustomEvent) => {
  const { status, message } = e.detail;
  if (status === 403) {
    notifications.show({
      title: i18n.t("common.noPermission"),
      message: message || i18n.t("common.noPermissionDesc"),
      color: "yellow",
      autoClose: 4000,
    });
  }
}) as EventListener);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <ModalsProvider>
          <SWRConfig
            value={{
              fetcher: (url: string) => api.get(url).then((res) => res.data),
              // Global `refreshInterval: 30000` olib tashlandi: u har bir SWR
              // kalitiga (savollar, foydalanuvchilar, paketlar, biletlar,
              // mavzular...) meros bo'lib o'tardi va admin panel ochiq turgan
              // sahifada har 30 soniyada barcha ro'yxatlarni qayta so'rardi.
              // Haqiqatan polling kerak bo'lgan joylar (license, computers,
              // learning centers, backup job) o'z hooklarida refreshInterval ni
              // aniq belgilaydi.
              refreshInterval: 0,
              revalidateOnFocus: true,
              dedupingInterval: 5000,
              // Sahifalash/filtrlashda ro'yxat "bo'sh → to'la" bo'lib
              // sakramasligi uchun eski ma'lumot ko'rsatib turiladi
              keepPreviousData: true,
              errorRetryCount: 2,
            }}
          >
            <Notifications />
            <App />
          </SWRConfig>
        </ModalsProvider>
      </MantineProvider>
    </ErrorBoundary>
  </StrictMode>
);
