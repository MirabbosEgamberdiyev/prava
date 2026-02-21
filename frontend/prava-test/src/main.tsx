import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./index.css";
import { theme } from "./theme";

import { Notifications } from "@mantine/notifications";
import { SWRConfig } from "swr";
import api from "./api/api.ts";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ENV } from "./config/env.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID}>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <SWRConfig
          value={{
            fetcher: (url: string) => api.get(url).then((res) => res.data),
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            shouldRetryOnError: true,
            errorRetryCount: 3,
            dedupingInterval: 5000,
          }}
        >
          <Notifications />
          <App />
        </SWRConfig>
      </MantineProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
