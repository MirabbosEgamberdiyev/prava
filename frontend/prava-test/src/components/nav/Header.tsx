import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Button,
  Container,
  Flex,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import { useAuth } from "../../auth/AuthContext";
import { Link } from "react-router-dom";
import { IconBrandInstagram, IconBrandTelegram } from "@tabler/icons-react";

export default function Header({
  opened,
  toggle,
}: {
  opened: boolean;
  toggle: () => void;
}) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const initials = user
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase()
    : "";

  return (
    <AppShell.Header>
      <Container h="100%" size="xl" px="md" style={{ overflow: "hidden" }}>
        <Group justify="space-between" h="100%" wrap="nowrap" align="center">
          <Flex gap="sm" wrap="nowrap" align="center">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Link to="/" style={{ textDecoration: "none" }}>
              <Text fw={600} size="xl" tt="uppercase" c="blue.6">
                PravaOnline
              </Text>
            </Link>
          </Flex>

          {/* Center: Social links (desktop only) */}
          <Group h="100%" gap="xs" visibleFrom="sm" style={{ flexShrink: 0 }}>
            <Tooltip label="Instagram">
              <ActionIcon
                component="a"
                href="https://instagram.com/pravaonline"
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                radius="md"
                size="lg"
              >
                <IconBrandInstagram size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Telegram">
              <ActionIcon
                component="a"
                href="https://t.me/pravaonline"
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                radius="md"
                size="lg"
              >
                <IconBrandTelegram size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Right: Theme + Language + Auth */}
          <Group gap={8} wrap="nowrap" style={{ flexShrink: 1, minWidth: 0 }}>
            <ColorMode />
            <LanguagePicker />
            {isAuthenticated ? (
              <Link to="/me" style={{ flexShrink: 0 }}>
                <Avatar radius="md" size="sm" color="blue">
                  {initials || "U"}
                </Avatar>
              </Link>
            ) : (
              <Group visibleFrom="sm" gap="xs" wrap="nowrap">
                <Link to="/auth/login">
                  <Button variant="subtle" radius="md" size="sm">
                    {t("nav.login_btn")}
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button radius="md" size="sm">
                    {t("nav.signup_btn")}
                  </Button>
                </Link>
              </Group>
            )}
          </Group>
        </Group>
      </Container>
    </AppShell.Header>
  );
}
