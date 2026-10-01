import { memo } from "react";
import { Tooltip } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconLock } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthContext";
import { SHELL_NAV_FOOTER, SHELL_NAV_MAIN, SHELL_NAV_SECTIONS, type ShellNavItem } from "./navItems";
import { toggleSidebar, useSidebarCollapsed } from "./sidebarPrefs";

function NavButton({ item, active, collapsed, locked }: { item: ShellNavItem; active: boolean; collapsed: boolean; locked: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const label = t(item.labelKey, item.fallback);
  const Icon = item.icon;
  const lockLabel = t("guest.requiresAuth");
  const baseTip = item.shortcut ? `${label} (${item.shortcut})` : label;
  const tip = locked ? `${baseTip} — ${lockLabel}` : baseTip;

  const button = (
    <button
      type="button"
      className={`shell-nav-item${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed || locked ? (locked ? `${label}, ${lockLabel}` : label) : undefined}
      aria-keyshortcuts={item.shortcut === "Ctrl+," ? "Control+Comma" : undefined}
      onClick={() => navigate(item.path)}
      title={collapsed ? undefined : item.shortcut || locked ? tip : undefined}
    >
      <Icon size={18} stroke={active ? 2 : 1.7} />
      {!collapsed && <span className="shell-nav-label">{label}</span>}
      {locked && (
        <IconLock
          size={collapsed ? 10 : 13}
          stroke={2}
          aria-hidden
          className="shell-nav-lock"
          style={
            collapsed
              ? { position: "absolute", right: 6, bottom: 6, opacity: 0.75 }
              : { marginLeft: "auto", flexShrink: 0, opacity: 0.6 }
          }
        />
      )}
    </button>
  );

  if (!collapsed) return button;
  return (
    <Tooltip label={tip} position="right" withArrow openDelay={250} transitionProps={{ duration: 0 }}>
      {button}
    </Tooltip>
  );
}

/**
 * Collapsible left navigation rail (Ctrl+B). Collapsed = icons only (48px), expanded = 232px.
 * State is a persisted per-user preference (localStorage), see sidebarPrefs.ts.
 */
function Sidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const collapsed = useSidebarCollapsed();
  const { isAuthenticated } = useAuth();
  const toggleLabel = collapsed
    ? t("desktopShell.sidebar.expand", "Panelni yoyish")
    : t("desktopShell.sidebar.collapse", "Panelni yig'ish");

  return (
    <nav
      className={`shell-sidebar${collapsed ? " is-collapsed" : ""}`}
      aria-label={t("desktopShell.sidebar.label", "Asosiy navigatsiya")}
    >
      {collapsed ? (
        <div className="shell-nav-group">
          {SHELL_NAV_MAIN.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={item.match(pathname)}
              collapsed={collapsed}
              locked={!isAuthenticated && !!item.requiresAuth}
            />
          ))}
        </div>
      ) : (
        <div className="shell-nav-sections">
          {SHELL_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="shell-nav-section">
              {section.id !== "main" && (
                <div className="shell-nav-section-title">
                  <span>{t(section.labelKey, section.fallback)}</span>
                </div>
              )}
              <div className="shell-nav-section-items">
                {section.items.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={item.match(pathname)}
                    collapsed={false}
                    locked={!isAuthenticated && !!item.requiresAuth}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="shell-nav-group shell-nav-footer">
        {SHELL_NAV_FOOTER.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={item.match(pathname)}
            collapsed={collapsed}
            locked={!isAuthenticated && !!item.requiresAuth}
          />
        ))}
        <Tooltip label={`${toggleLabel} (Ctrl+B)`} position="right" withArrow openDelay={250} transitionProps={{ duration: 0 }}>
          <button
            type="button"
            className="shell-nav-item shell-nav-toggle"
            onClick={toggleSidebar}
            aria-label={toggleLabel}
            aria-keyshortcuts="Control+B"
            aria-expanded={!collapsed}
          >
            {collapsed ? <IconLayoutSidebarLeftExpand size={18} stroke={1.7} /> : <IconLayoutSidebarLeftCollapse size={18} stroke={1.7} />}
            {!collapsed && (
              <span className="shell-nav-label">
                {toggleLabel}
                <kbd>Ctrl B</kbd>
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    </nav>
  );
}

export default memo(Sidebar);
