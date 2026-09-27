import {
  Divider,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconFileText } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

export default function Terms_Page() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.terms.title")}
        description={t("seo.terms.desc")}
        keywords="prava online foydalanish shartlari, terms of service prava online, ommaviy oferta prava"
        canonical="/terms"
      />

      <div className="saas-page-container" style={{ maxWidth: 1040 }}>
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconFileText size={13} />
            <span>{t("legal.termsBadge")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("legal.termsTitle")}
          </h1>
          <p className="saas-page-subtitle">
            {t("legal.lastUpdated")}
          </p>
        </div>

        <div className="saas-card" style={{ padding: "40px 32px", marginBottom: 64 }}>
          <Stack gap="md">
            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec1Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec1Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec2Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec2Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec3Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec3Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec4Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec4Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec5Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec5Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec6Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec6Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.terms.sec7Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.terms.sec7Text"
              )}
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
}
