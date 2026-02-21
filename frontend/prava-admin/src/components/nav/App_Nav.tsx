import AdminNavUrlData from "../../data/AdminNavUrlData";
import type { NavItem } from "../../data/AdminNavUrlData";
import { NavLink, Box, ActionIcon, AppShell } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/AuthContext";
import { useTranslation } from "react-i18next";

interface AppShellNavbarProps {
  toggle: () => void;
}

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const App_Nav = ({ toggle }: AppShellNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const userRoleLevel = ROLE_HIERARCHY[user?.role] || 0;

  const hasAccess = (requiredRole?: string) => {
    if (!requiredRole) return true;
    return userRoleLevel >= (ROLE_HIERARCHY[requiredRole] || 0);
  };

  const filteredNav = AdminNavUrlData.filter((item) => hasAccess(item.role));

  return (
    <AppShell.Navbar p="sm">
      <Box>
        {filteredNav.map((item: NavItem, i: number) => {
          const filteredSub = item.sub?.filter((sub) => hasAccess(sub.role));

          return (
            <NavLink
              key={i}
              label={t(item.name)}
              leftSection={
                <ActionIcon variant="light">{item.icon}</ActionIcon>
              }
              childrenOffset={28}
              variant="light"
              onClick={() => {
                if (!filteredSub || filteredSub.length === 0) {
                  toggle();
                  navigate(item.url);
                }
              }}
              active={!filteredSub && location.pathname === item.url}
              defaultOpened={
                !!filteredSub && location.pathname.includes(item.url)
              }
              style={{ borderRadius: "4px", fontWeight: "500" }}
              my="xs"
            >
              {filteredSub?.map((sub, index) => (
                <NavLink
                  key={index}
                  label={t(sub.name)}
                  variant="light"
                  active={location.pathname === sub.url}
                  onClick={() => {
                    toggle();
                    navigate(sub.url);
                  }}
                  style={{ borderRadius: "4px", fontWeight: "400" }}
                />
              ))}
            </NavLink>
          );
        })}
      </Box>
    </AppShell.Navbar>
  );
};

export default App_Nav;
