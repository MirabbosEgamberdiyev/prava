import React from "react";
import {
  AppShell,
  Box,
  Burger,
  Button,
  Container,
  Group,
  Tooltip,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import UserMenuButton from "./UserMenuButton";
import { useAuth } from "../../auth/AuthContext";
import {
  IconBrandTelegram,
  IconArrowRight,
} from "@tabler/icons-react";
import { prefetchRoute } from "../../utils/routePrefetch";
import { DomainLink } from "../common/DomainLink";
import { getLandingUrl, getWebAppUrl } from "../../utils/domain";

export default function Header({
  opened,
  toggle,
}: {
  opened: boolean;
  toggle: () => void;
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <AppShell.Header className="saas-header">
      <Container h="100%" size={1440} px={{ base: "xs", sm: "md", lg: "lg" }} style={{ maxWidth: 1440, width: "100%" }}>
        <div className="saas-header-inner">
          {/* Left: Mobile Burger + Brand */}
          <Group gap="xs" wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={opened ? t("nav.close_menu", "Menyuni yopish") : t("nav.open_menu", "Menyuni ochish")}
            />
            <DomainLink
              href={getLandingUrl("/")}
              className="saas-brand"
              aria-label="Prava Online"
              onMouseEnter={() => prefetchRoute("/")}
              onFocus={() => prefetchRoute("/")}
            >
              <img
                src="/logo.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.svg";
                }}
                alt="Prava Online"
                width={30}
                height={30}
              />
              <span className="saas-brand-text">
                PRAVA<span className="brand-accent">ONLINE</span>
              </span>
            </DomainLink>
          </Group>

          {/* Right: Telegram + Theme + Language + Single CTA button (OsonPrava Style) */}
          <Group gap={8} wrap="nowrap" align="center" style={{ flexShrink: 0 }} className="saas-header-right">
            <Box visibleFrom="sm">
              <Tooltip label="Telegram" position="bottom" withArrow>
                <a
                  href="https://t.me/pravaonlineuz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-control-icon-btn"
                  aria-label="Telegram kanalimiz"
                >
                  <IconBrandTelegram size={17} color="#0088cc" stroke={1.8} />
                </a>
              </Tooltip>
            </Box>

            <ColorMode />
            <LanguagePicker />

            <div className="navbar-divider" aria-hidden="true" />

            {isAuthenticated ? (
              <UserMenuButton />
            ) : (
              <DomainLink
                href={getWebAppUrl("/auth/login")}
                style={{ textDecoration: "none" }}
                onMouseEnter={() => prefetchRoute("/auth/login")}
                onFocus={() => prefetchRoute("/auth/login")}
              >
                <Button
                  radius="md"
                  size="sm"
                  h={38}
                  variant="filled"
                  style={{
                    background: "var(--primary, #0284c7)",
                    color: "#ffffff",
                    fontWeight: 700,
                    padding: "0 22px",
                    border: "none",
                  }}
                  rightSection={<IconArrowRight size={15} />}
                >
                  {t("home.hero.startNow", "Boshlash")}
                </Button>
              </DomainLink>
            )}
          </Group>
        </div>
      </Container>
    </AppShell.Header>
  );
}

export const MemoizedHeader = React.memo(Header);
