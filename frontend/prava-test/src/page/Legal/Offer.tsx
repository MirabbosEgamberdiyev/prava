import {
  Divider,
  Stack,
  Text,
  Title,
  Group,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconFileCertificate, IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

export default function Offer_Page() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.offer.title")}
        description={t(
          "seo.offer.desc"
        )}
        keywords="prava online oferta, ommaviy oferta prava, ommaviy shartnoma prava test, to'lov shartlari prava"
        canonical="/offer"
      />

      <div className="saas-page-container" style={{ maxWidth: 1040 }}>
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconFileCertificate size={13} />
            <span>{t("legal.offerBadge")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("legal.offerTitle")}
          </h1>
          <p className="saas-page-subtitle">
            {t("legal.lastUpdated")}
          </p>
        </div>

        <div className="saas-card" style={{ padding: "40px 32px", marginBottom: 64 }}>
          <Stack gap="md">
            <Box p="md" style={{ borderRadius: 12, background: "var(--card-highlight-bg, rgba(var(--primary-rgb), 0.04))", border: "1px solid var(--border)" }}>
              <Group gap="xs" align="flex-start">
                <ThemeIcon size={22} radius="xl" color="blue" variant="light" mt={2}>
                  <IconShieldCheck size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" lh={1.6}>
                  {t(
                    "legal.offerNotice"
                  )}
                </Text>
              </Group>
            </Box>

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec1Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec1Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec2Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec2Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec3Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec3Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec4Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec4Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec5Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec5Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec6Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec6Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec7Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec7Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec8Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec8Text"
              )}
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
}
