import {
  ActionIcon,
  Anchor,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
} from "@mantine/core";
import {
  IconBrandTelegram,
  IconBrandInstagram,
  IconWorld,
  IconHeart,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === "dark";

  const socialLinks = [
    {
      label: "Telegram",
      href: "https://t.me/pravaonlineuz",
      icon: <IconBrandTelegram size={20} />,
      color: "blue",
    },
    {
      label: "Instagram",
      href: "https://instagram.com/pravaonlineuz",
      icon: <IconBrandInstagram size={20} />,
      color: "grape",
    },
    {
      label: t("footer.website"),
      href: "https://pravaonline.uz",
      icon: <IconWorld size={20} />,
      color: "teal",
    },
  ];

  const navLinks = [
    { label: t("nav.home"), to: "/" },
    {
      label: t("footer.telegram"),
      to: "https://t.me/pravaonlineuz",
      external: true,
    },
    {
      label: t("footer.donate"),
      to: "https://tirikchilik.uz/pravaonline",
      external: true,
    },
  ];

  return (
    <Paper component="footer" bg={isDark ? "dark.8" : "gray.1"} mt={"lg"}>
      <Container size="xl" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          {/* Brand */}
          <Stack gap="sm">
            <Group gap="xs">
              <Image
                src="/logo.svg"
                alt="Prava Online"
                w={32}
                h={32}
                fallbackSrc="/favicon.svg"
              />
              <Text fw={800} size="lg" c="blue">
                PravaOnline
              </Text>
            </Group>
            <Text size="sm" c="dimmed" maw={280} lh={1.6}>
              {t("footer.description")}
            </Text>
            <Group gap="xs" mt={4}>
              {socialLinks.map((link) => (
                <Tooltip label={link.label} key={link.href}>
                  <ActionIcon
                    component="a"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtle"
                    color={link.color}
                    size="lg"
                    radius="xl"
                  >
                    {link.icon}
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
          </Stack>

          {/* Quick Links */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed" mb={4}>
              {t("footer.links")}
            </Text>
            {navLinks.map((link) =>
              link.external ? (
                <Anchor
                  key={link.to}
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  c={isDark ? "gray.4" : "gray.7"}
                  underline="hover"
                >
                  {link.label}
                </Anchor>
              ) : (
                <Anchor
                  key={link.to}
                  component={Link}
                  to={link.to}
                  size="sm"
                  c={isDark ? "gray.4" : "gray.7"}
                  underline="hover"
                >
                  {link.label}
                </Anchor>
              ),
            )}
          </Stack>

          {/* Contact */}
          <Stack gap="xs">
            <Text fw={600} size="sm" tt="uppercase" c="dimmed" mb={4}>
              {t("footer.contact")}
            </Text>
            <Group gap={8}>
              <IconMail size={16} color="var(--mantine-color-dimmed)" />
              <Anchor
                href="mailto:info@pravaonline.uz"
                size="sm"
                c={isDark ? "gray.4" : "gray.7"}
                underline="hover"
              >
                info@pravaonline.uz
              </Anchor>
            </Group>
            <Group gap={8}>
              <IconPhone size={16} color="var(--mantine-color-dimmed)" />
              <Anchor
                href="tel:+998993912505"
                size="sm"
                c={isDark ? "gray.4" : "gray.7"}
                underline="hover"
              >
                +998 99 391 25 05
              </Anchor>
            </Group>
            <Group gap={8}>
              <IconHeart size={16} color="var(--mantine-color-red-5)" />
              <Anchor
                href="https://tirikchilik.uz/pravaonline"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                c={isDark ? "gray.4" : "gray.7"}
                underline="hover"
              >
                {t("footer.donate")}
              </Anchor>
            </Group>
          </Stack>
        </SimpleGrid>

        <Divider my="lg" color={isDark ? "dark.4" : "gray.3"} />

        <Text size="xs" c="dimmed" ta="center">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </Text>
      </Container>
    </Paper>
  );
};

export default Footer;
