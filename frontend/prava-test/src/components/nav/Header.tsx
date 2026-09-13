import React from "react";
import {
  AppShell,
  Box,
  Burger,
  Container,
  Group,
  Tooltip,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import UserMenuButton from "./UserMenuButton";
import { useAuth } from "../../auth/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { IconBrandTelegram } from "@tabler/icons-react";
import { prefetchRoute } from "../../utils/routePrefetch";

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

  const navItems = [
    { label: t("nav.home", "Bosh sahifa"), to: "/" },
    { label: t("nav.corporate", "Hamkorlik"), to: "/partners" },
    {
      label: t("home.hero.freeExam", "Sinov imtihoni"),
      to: "/try-exam",
      badge: t("common.free", "Bepul"),
    },
    { label: t("nav.downloads", "Ilovalar"), to: "/downloads" },
    { label: t("nav.about", "Biz haqimizda"), to: "/about" },
    { label: t("nav.contact", "Bog'lanish"), to: "/contact" },
    { label: t("nav.faq", "FAQ"), to: "/faq" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <AppShell.Header className="saas-header">
      <Container h="100%" size={1440} px={{ base: "sm", sm: "md", lg: "lg" }} style={{ maxWidth: 1440 }}>
        <div className="saas-header-inner">
          {/* Left: Mobile Burger + Brand */}
          <Group gap="sm" wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
              aria-label={opened ? t("nav.close_menu", "Menyuni yopish") : t("nav.open_menu", "Menyuni ochish")}
            />
            <Link
              to="/"
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
                width={32}
                height={32}
              />
              <span className="saas-brand-text">
                PRAVA<span className="brand-accent">ONLINE</span>
              </span>
            </Link>
          </Group>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="saas-nav-container" aria-label="Asosiy navigatsiya">
            <Group gap={4} visibleFrom="md" wrap="nowrap">
              {navItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`saas-nav-link${active ? " active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={() => prefetchRoute(item.to)}
                    onFocus={() => prefetchRoute(item.to)}
                  >
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
                  </Link>
                );
              })}
            </Group>
          </nav>

          {/* Right: Social + Theme + Language + Auth */}
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
                  <IconBrandTelegram size={18} color="#0088cc" stroke={1.8} />
                </a>
              </Tooltip>
            </Box>

            <ColorMode />
            <LanguagePicker />

            <div className="navbar-divider" aria-hidden="true" />

            {isAuthenticated ? (
              <UserMenuButton />
            ) : (
              <Group gap="xs" wrap="nowrap" visibleFrom="xs">
                <Link
                  to="/auth/login"
                  className="saas-btn-ghost"
                  onMouseEnter={() => prefetchRoute("/auth/login")}
                  onFocus={() => prefetchRoute("/auth/login")}
                >
                  {t("nav.login_btn", "Kirish")}
                </Link>
                <Link
                  to="/auth/register"
                  className="saas-btn-primary"
                  onMouseEnter={() => prefetchRoute("/auth/register")}
                  onFocus={() => prefetchRoute("/auth/register")}
                >
                  {t("nav.signup_btn", "Ro'yxatdan o'tish")}
                </Link>
              </Group>
            )}
          </Group>
        </div>
      </Container>
    </AppShell.Header>
  );
}

export const MemoizedHeader = React.memo(Header);
