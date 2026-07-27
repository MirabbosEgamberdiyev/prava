import React from "react";
import { Center, Stack, Text, Button, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: "chunk" | "network" | "render";
}

/**
 * NO-RELOAD AUDIT FIX: mirrors prava-test's ErrorBoundary classification.
 * A stale JS chunk (post-deploy) genuinely needs a hard reload to fetch the
 * new bundle — there's nothing a soft reset can do about that. Everything
 * else (a transient network blip, or an unexpected render crash) doesn't
 * need to blow away the whole SPA and re-download every asset.
 */
function classifyError(error: Error): "chunk" | "network" | "render" {
  const message = error.message || "";
  if (
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed")
  ) {
    return "chunk";
  }
  if (
    message.includes("NetworkError") ||
    message.includes("Failed to fetch") ||
    message.includes("Load failed")
  ) {
    return "network";
  }
  return "render";
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorType: "render" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorType: classifyError(error) };
  }

  // Ilgari xatolik hech qayerga yozilmasdi — prodda nima yiqilgani noma'lum edi
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  /**
   * Network errors are transient — just reset local state and let React
   * retry rendering. No reload needed. (Chunk errors are handled by a
   * dedicated reload button; see render() below — this boundary sits above
   * <BrowserRouter> in main.tsx, so there's no router context to soft-navigate
   * through, but a state reset alone is enough here since nothing was
   * actually broken beyond the failed request.)
   */
  handleSoftReset = () => {
    this.setState({ hasError: false, error: null, errorType: "render" });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { errorType } = this.state;

      if (errorType === "chunk") {
        return (
          <Center h="100vh">
            <Stack align="center" gap="md" maw={400}>
              <IconAlertTriangle size={64} color="var(--mantine-color-blue-6)" />
              <Title order={3}>Yangilanish mavjud / Update available</Title>
              <Text c="dimmed" ta="center">
                Ilova yangilandi, sahifani qayta yuklang / The app was
                updated, please reload.
              </Text>
              <Button onClick={this.handleReload} variant="light">
                Qayta yuklash / Reload
              </Button>
            </Stack>
          </Center>
        );
      }

      if (errorType === "network") {
        return (
          <Center h="100vh">
            <Stack align="center" gap="md" maw={400}>
              <IconAlertTriangle size={64} color="var(--mantine-color-yellow-6)" />
              <Title order={3}>Internet aloqasi yo'q / No internet connection</Title>
              <Text c="dimmed" ta="center">
                Internet aloqasini tekshirib qayta urinib ko'ring / Check your
                connection and try again.
              </Text>
              <Button onClick={this.handleSoftReset} variant="light">
                Qayta urinish / Retry
              </Button>
            </Stack>
          </Center>
        );
      }

      return (
        <Center h="100vh">
          <Stack align="center" gap="md" maw={400}>
            <IconAlertTriangle size={64} color="var(--mantine-color-red-6)" />
            <Title order={3}>Xatolik yuz berdi / Something went wrong</Title>
            <Text c="dimmed" ta="center">
              Sahifani qayta yuklang / Please try refreshing the page.
            </Text>
            {/* Texnik xato matni faqat dev'da: prodda u ichki modul/yo'l
                nomlarini foydalanuvchiga ochib berardi */}
            {import.meta.env.DEV && this.state.error && (
              <Text size="xs" c="red" ta="center" style={{ wordBreak: "break-all" }}>
                {this.state.error.message}
              </Text>
            )}
            <Button onClick={this.handleReload} variant="light">
              Qayta yuklash / Reload
            </Button>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
