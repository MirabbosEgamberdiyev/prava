import { useAuth } from "@/auth/AuthContext";
import { AppShell, Button, Flex, Group, NavLink } from "@mantine/core";
import { IconBrandInstagram, IconBrandTelegram, IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Navbar = ({ close }: { close: () => void }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  return (
    <AppShell.Navbar py="md" px="sm">
      <NavLink
        href="https://instagram.com/pravaonline"
        label="INSTAGRAM"
        target="_blank"
        leftSection={<IconBrandInstagram size={18} />}
        rightSection={
          <IconChevronRight size={18} className="mantine-rotate-rtl" />
        }
        active
      />
      <NavLink
        href="https://t.me/pravaonline"
        label="TELEGRAM"
        target="_blank"
        leftSection={<IconBrandTelegram size={18} />}
        rightSection={
          <IconChevronRight size={18} className="mantine-rotate-rtl" />
        }
        active
        mt={'md'}
      />
      <Flex align={"flex-end"} h={"100%"}>
        {isAuthenticated ? (
          <NavLink
            component={Link}
            to="/me"
            label={t("nav.dashboard")}
            onClick={close}
          />
        ) : (
          <Group grow w={"100%"}>
            <Link to="/auth/login" onClick={close}>
              <Button fullWidth variant="light" onClick={close}>
                {t("nav.login_btn")}
              </Button>
            </Link>
            <Link to="/auth/register" onClick={close}>
              <Button fullWidth>{t("nav.signup_btn")}</Button>
            </Link>
          </Group>
        )}
      </Flex>
    </AppShell.Navbar>
  );
};

export default Navbar;
