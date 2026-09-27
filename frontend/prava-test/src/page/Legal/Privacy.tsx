import {
  Divider,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

export default function Privacy_Page() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.privacy.title")}
        description={t("seo.privacy.desc")}
        keywords="prava online maxfiylik siyosati, privacy policy prava, shaxsiy ma'lumotlar xavfsizligi"
        canonical="/privacy"
      />

      <div className="saas-page-container" style={{ maxWidth: 1040 }}>
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconShieldCheck size={13} />
            <span>{t("legal.privacyBadge")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("legal.privacyTitle")}
          </h1>
          <p className="saas-page-subtitle">
            {t("legal.lastUpdated")}
          </p>
        </div>

        <div className="saas-card" style={{ padding: "40px 32px", marginBottom: 64 }}>
          <Stack gap="md">
            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec1Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec1Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec2Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec2Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec3Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec3Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec4Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec4Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec5Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec5Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec6Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec6Text"
              )}
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
}
