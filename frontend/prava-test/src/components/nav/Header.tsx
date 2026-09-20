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
import AccessibilityButton from "../common/AccessibilityButton";
import UserMenuButton from "./UserMenuButton";
import { useAuth } from "../../auth/AuthContext";
import {
  IconBrandTelegram,
  IconArrowRight,
} from "@tabler/icons-react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  const isRegisterOrForgot =
    location.pathname.includes("register") ||
    location.pathname.includes("forgot-password");
  const isLogin = location.pathname.includes("login");

  const authCtaText = isRegisterOrForgot
    ? t("auth.login", "Kirish")
    : isLogin
    ? t("home.hero.startNow", "Boshlash")
    : t("home.hero.startNow", "Boshlash");

  const authCtaHref = isRegisterOrForgot
    ? "/auth/login"
    : isLogin
    ? "/auth/register"
    : "/auth/login";

  return (
    <AppShell.Header className="saas-header">
      <Container h="100%" size={1440} px={{ base: "xs", sm: "md", lg: "lg" }} style={{ maxWidth: 1440, width: "100%" }}>
        <div className="saas-header-inner">
          {/* Left: Mobile Burger + Brand */}
          <Group gap="xs" wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
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
                src="/logo.svg"
                alt="Prava Online"
                width={32}
                height={32}
              />
              <span className="saas-brand-text">
                PRAVA<span className="brand-accent">ONLINE</span>
              </span>
            </DomainLink>
          </Group>

          {/* Center: Desktop Navigation Links */}
          <Box visibleFrom="md" className="saas-nav-container">
            <DomainLink href={getLandingUrl("/")} className="saas-nav-link">
              {t("nav.home", "Bosh sahifa")}
            </DomainLink>
            <a href={getLandingUrl("/#benefits")} className="saas-nav-link">
              {t("nav.features", "Imkoniyatlar")}
            </a>
            <DomainLink href={getLandingUrl("/partners")} className="saas-nav-link">
              {t("nav.partners", "Avtomaktablar")}
            </DomainLink>
            <a href={getLandingUrl("/#faq")} className="saas-nav-link">
              {t("nav.faq", "FAQ")}
            </a>
            <DomainLink href={getLandingUrl("/about")} className="saas-nav-link">
              {t("nav.about", "Biz haqimizda")}
            </DomainLink>
            <DomainLink href={getLandingUrl("/contact")} className="saas-nav-link">
              {t("nav.contact", "Bog'lanish")}
            </DomainLink>
          </Box>

          {/* Right: Telegram + Theme + Language + Single CTA button (OsonPrava Style) */}
          <Group gap={8} wrap="nowrap" align="center" style={{ flexShrink: 0 }} className="saas-header-right">
            <Box visibleFrom="sm">
              <Tooltip label="Telegram" position="bottom" withArrow>
                <a
                  href="https://t.me/pravaonlineuz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-control-icon-btn"
                  aria-label={t("nav.telegramChannel", "Telegram kanalimiz")}
                >
                  <IconBrandTelegram size={17} color="#0088cc" stroke={1.8} />
                </a>
              </Tooltip>
            </Box>

            <ColorMode />
            <LanguagePicker />
            <AccessibilityButton />

            <Box visibleFrom="sm" className="navbar-divider" aria-hidden="true" />

            {isAuthenticated ? (
              <UserMenuButton />
            ) : (
              <Box visibleFrom="sm">
                <DomainLink
                  href={getWebAppUrl(authCtaHref)}
                  style={{ textDecoration: "none" }}
                  onMouseEnter={() => prefetchRoute(authCtaHref)}
                  onFocus={() => prefetchRoute(authCtaHref)}
                >
                  <Button
                    radius="md"
                    size="sm"
                    h={38}
                    variant="filled"
                    className="header-cta-btn"
                    style={{
                      background: "var(--primary, #0284c7)",
                      color: "#ffffff",
                      fontWeight: 700,
                      border: "none",
                    }}
                    rightSection={<IconArrowRight size={15} />}
                  >
                    {authCtaText}
                  </Button>
                </DomainLink>
              </Box>
            )}
          </Group>
        </div>
      </Container>
    </AppShell.Header>
  );
}

export const MemoizedHeader = React.memo(Header);
