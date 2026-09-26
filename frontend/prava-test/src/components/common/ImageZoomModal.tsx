import { useState } from "react";
import { Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconX } from "@tabler/icons-react";
import SecureImage from "./SecureImage";

interface Props {
  /** Ko'rsatiladigan rasm; `null` — oyna yopiq. */
  src: string | null;
  onClose: () => void;
}

/**
 * Rasmni kattalashtirib ko'rish oynasi (P2-W6).
 *
 * Mantine `Modal` asosida: `role="dialog"` + `aria-modal`, focus trap, Esc bilan
 * yopish va yopilgach fokus rasmni ochgan elementga qaytadi. Fokus qaytishi
 * ishlashi uchun komponentni doim render qiling va `src={zoomSrc}` bering
 * (shartli `{zoomSrc && ...}` mount ham ishlaydi, lekin fokus qaytmaydi).
 */
export default function ImageZoomModal({ src, onClose }: Props) {
  const { t } = useTranslation();
  // Yopilish animatsiyasi paytida rasm yo'qolib qolmasligi uchun oxirgi src
  const [shownSrc, setShownSrc] = useState<string | null>(src);
  if (src && src !== shownSrc) setShownSrc(src);
  const current = src ?? shownSrc;

  return (
    <Modal.Root
      opened={!!src}
      onClose={onClose}
      centered
      size="auto"
      zIndex={10001}
      transitionProps={{ transition: "fade", duration: 150 }}
    >
      <Modal.Overlay backgroundOpacity={0.85} blur={4} />
      <Modal.Content
        aria-label={t("a11y.imageZoomDialog", "Rasm kattalashtirilgan ko'rinishda")}
        onContextMenu={(e) => e.preventDefault()}
        styles={{
          content: {
            background: "transparent",
            boxShadow: "none",
            overflow: "visible",
            maxWidth: "90vw",
            flex: "0 0 auto",
          },
        }}
      >
        <button
          className="img-zoom-close"
          onClick={onClose}
          type="button"
          aria-label={t("common.close", "Yopish")}
          style={{ position: "fixed" }}
        >
          <IconX size={20} />
        </button>
        <Modal.Body p={0} className="img-zoom-content">
          {current &&
            (current.startsWith("data:") ||
            current.startsWith("http") ||
            current.startsWith("/") ||
            current.startsWith("blob:") ? (
              <img
                src={current}
                alt=""
                className="img-zoom-img"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            ) : (
              <SecureImage path={current} className="img-zoom-img" />
            ))}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

/** ZoomableImage — image_path qabul qilib SecureImage ko'rsatadi */
interface ZoomableProps {
  path: string;
  className?: string;
  onOpen: (src: string) => void;
}

export function ZoomableImage({ path, className, onOpen }: ZoomableProps) {
  return (
    <SecureImage
      path={path}
      className={className}
      onOpen={onOpen}
    />
  );
}
