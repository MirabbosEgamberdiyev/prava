import { AdminNavCategories } from "../../data/AdminNavUrlData";
import type { NavItem, NavCategory } from "../../data/AdminNavUrlData";
import { NavLink, Box, ActionIcon, AppShell, ScrollArea, Text, Divider } from "@mantine/core";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/AuthContext";
import { useTranslation } from "react-i18next";

interface AppShellNavbarProps {
  /** Navigatsiyadan keyin mobil navbarni yopish */
  close: () => void;
}

const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  ANALYST: 2,
  SUPPORT: 2,
  CONTENT_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

const App_Nav = ({ close }: AppShellNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const userRoleLevel = ROLE_HIERARCHY[user?.role || ""] || 0;

  const hasAccess = (requiredRole?: string, allowedRoles?: string[]) => {
    if (user?.role === "SUPER_ADMIN") return true;
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.includes(user?.role || "");
    }
    if (requiredRole) {
      return userRoleLevel >= (ROLE_HIERARCHY[requiredRole] || 0);
    }
    return true;
  };

  const isCurrentActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname === url;
  };

  return (
    <AppShell.Navbar p="xs" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppShell.Section grow component={ScrollArea} scrollbars="y" type="auto" offsetScrollbars>
        <Box pr={4} py={4}>
          {AdminNavCategories.map((category: NavCategory, catIdx: number) => {
            // Category-level permission check
            if (category.roles && !hasAccess(undefined, category.roles)) {
              return null;
            }

            // Filter items within category
            const accessibleItems = category.items.filter((item) =>
              hasAccess(item.role, item.roles)
            );

            if (accessibleItems.length === 0) return null;

            return (
              <Box key={category.categoryKey} mb="md">
                {catIdx > 0 && (
                  <>
                    <Divider my="xs" opacity={0.5} />
                    <Text
                      size="10px"
                      fw={700}
                      c="dimmed"
                      tt="uppercase"
                      px="xs"
                      mb={6}
                      style={{ letterSpacing: "0.8px" }}
                    >
                      {t(category.categoryName)}
                    </Text>
                  </>
                )}

                {accessibleItems.map((item: NavItem, i: number) => {
                  const filteredSub = item.sub?.filter((sub) =>
                    hasAccess(sub.role, sub.roles)
                  );
                  const hasSub = !!filteredSub && filteredSub.length > 0;
                  const isOpened =
                    hasSub && item.url !== "/" && location.pathname.startsWith(item.url);

                  return (
                    <NavLink
                      key={`${category.categoryKey}-${i}`}
                      label={t(item.name)}
                      leftSection={
                        <ActionIcon variant="light" size="sm" radius="md">
                          {item.icon}
                        </ActionIcon>
                      }
                      childrenOffset={24}
                      variant="light"
                      onClick={() => {
                        if (!hasSub) {
                          close();
                          navigate(item.url);
                        }
                      }}
                      active={!hasSub && isCurrentActive(item.url)}
                      defaultOpened={isOpened}
                      style={{ borderRadius: "8px", fontWeight: "500", marginBottom: "4px" }}
                    >
                      {filteredSub?.map((sub, index) => (
                        <NavLink
                          key={index}
                          label={t(sub.name)}
                          variant="light"
                          active={location.pathname === sub.url}
                          onClick={() => {
                            close();
                            navigate(sub.url);
                          }}
                          style={{ borderRadius: "6px", fontWeight: "400", marginBottom: "2px" }}
                        />
                      ))}
                    </NavLink>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </AppShell.Section>
    </AppShell.Navbar>
  );
};

export default App_Nav;
