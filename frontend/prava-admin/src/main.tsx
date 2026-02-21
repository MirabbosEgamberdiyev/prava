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
              refreshInterval: 30000,
              fetcher: (url: string) => api.get(url).then((res) => res.data),
              revalidateOnFocus: true,
              dedupingInterval: 5000,
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
