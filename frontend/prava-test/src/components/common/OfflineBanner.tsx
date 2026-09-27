import { Alert, Text } from "@mantine/core";
import { IconWifiOff, IconWifi } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useConnectionMonitor } from "../../hooks/useConnectionMonitor";

/**
 * Imtihon davomida internet holatini ko'rsatadi.
 *
 * `useConnectionMonitor` hooki mavjud edi, lekin hech qayerda ISHLATILMAGAN edi
 * (o'lik kod). Natijada internet uzilganda foydalanuvchi buni bilmasdan
 * javob berishda davom etardi va faqat "Yakunlash" bosganda xato ko'rardi.
 *
 * Endi: offline bo'lganda doimiy ogohlantirish + javoblar qurilmada
 * saqlanayotgani haqida tinchlantiruvchi xabar; internet qaytganda esa
 * qisqa muddatli tasdiq.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline, wasOffline } = useConnectionMonitor();

  if (!isOnline) {
    return (
      <Alert
        color="orange"
        variant="filled"
        radius={0}
        icon={<IconWifiOff size={18} />}
        role="status"
        aria-live="assertive"
        p="xs"
      >
        <Text size="sm" fw={600}>
          {t("errors.noInternetTitle")}
        </Text>
        <Text size="xs">
          {t("exam.offlineAnswersSafe")}
        </Text>
      </Alert>
    );
  }

  if (wasOffline) {
    return (
      <Alert
        color="green"
        variant="light"
        radius={0}
        icon={<IconWifi size={18} />}
        role="status"
        aria-live="polite"
        p="xs"
      >
        <Text size="sm">
          {t("exam.backOnline")}
        </Text>
      </Alert>
    );
  }

  return null;
}

export default OfflineBanner;
