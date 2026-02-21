import React from "react";
import { Center, Stack, Text, Button, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Center h="100vh">
          <Stack align="center" gap="md" maw={400}>
            <IconAlertTriangle size={64} color="var(--mantine-color-red-6)" />
            <Title order={3}>Xatolik yuz berdi / Something went wrong</Title>
            <Text c="dimmed" ta="center">
              Sahifani qayta yuklang / Please try refreshing the page.
            </Text>
            {this.state.error && (
              <Text size="xs" c="red" ta="center" style={{ wordBreak: "break-all" }}>
                {this.state.error.message}
              </Text>
            )}
            <Button onClick={this.handleReset} variant="light">
              Bosh sahifa / Home
            </Button>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
