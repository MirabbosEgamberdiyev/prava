import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import LanguagePicker from "../language/LanguagePicker";
import { useAuth } from "../../hooks/auth/AuthContext";
import UserMenuButton from "./UserMenuButton";
import { useTranslation } from "react-i18next";

const App_Header = ({
  opened,
  toggle,
}: {
  opened: boolean;
  toggle: () => void;
}) => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <AppShell.Header>
      <Container h="100%" fluid px="md" style={{ overflow: "hidden" }}>
        <Group h="100%" justify="space-between" wrap="nowrap">
          {/* Left: Burger + Logo */}
          <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Link
              to="/"
              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
            >
              <img src="/logo.svg" height={36} alt="PravaOnline" />
              <Text c="blue" size="xl" fw="bold" visibleFrom="xs">
                PravaOnline
              </Text>
            </Link>
          </Group>

          {/* Right: Theme + Language + Profile */}
          <Group gap={8} wrap="nowrap" style={{ flexShrink: 1, minWidth: 0 }}>
            <ActionIcon
              onClick={() =>
                setColorScheme(
                  computedColorScheme === "light" ? "dark" : "light"
                )
              }
              variant="light"
              size="lg"
              radius="md"
              aria-label="Toggle color scheme"
            >
              {computedColorScheme === "light" ? (
                <IconMoon stroke={1.5} size={18} />
              ) : (
                <IconSun stroke={1.5} size={18} />
              )}
            </ActionIcon>
            <LanguagePicker />
            {isAuthenticated ? (
              <UserMenuButton />
            ) : (
              <Link to="/auth/login">
                <Button variant="outline" radius="md" size="sm">
                  {t("nav.login_btn")}
                </Button>
              </Link>
            )}
          </Group>
        </Group>
      </Container>
    </AppShell.Header>
  );
};

export default App_Header;
