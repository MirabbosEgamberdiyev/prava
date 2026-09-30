import { Modal, Stack, Title, Text, Button, ScrollArea, Group, ThemeIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconFileText, IconShieldCheck } from "@tabler/icons-react";

interface TermsModalProps {
  opened: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

const SECTIONS = [1, 2, 3] as const;

export default function TermsModal({ opened, onClose, type }: TermsModalProps) {
  const { t } = useTranslation();
  const isTerms = type === "terms";
  const base = isTerms ? "auth.legal.terms" : "auth.legal.privacy";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      closeButtonProps={{ "aria-label": t("common.close") }}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" color="blue" variant="light" radius="md" aria-hidden="true">
            {isTerms ? <IconFileText size={18} /> : <IconShieldCheck size={18} />}
          </ThemeIcon>
          <Title order={4} fw={700} fz={16}>
            {isTerms ? t("auth.termsOfService") : t("auth.privacyPolicy")}
          </Title>
        </Group>
      }
      centered
      radius="lg"
      size="md"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <ScrollArea.Autosize mah={360} type="auto" offsetScrollbars>
        <Stack gap="sm">
          {SECTIONS.map((n) => (
            <Stack gap={4} key={n}>
              <Text fw={700} fz={15}>
                {t(`${base}.s${n}Title`)}
              </Text>
              <Text fz={13.5} c="dimmed">
                {t(`${base}.s${n}Body`)}
              </Text>
            </Stack>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      <Button fullWidth mt="md" radius="md" color="blue" onClick={onClose}>
        {t("auth.legal.ok")}
      </Button>
    </Modal>
  );
}
