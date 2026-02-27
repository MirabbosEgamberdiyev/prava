import { Box, Image, Text, useComputedColorScheme } from "@mantine/core";

interface ImagePlaceholderProps {
  src?: string | null;
  onClick?: () => void;
  radius?: string;
  style?: React.CSSProperties;
}

/**
 * Savol rasmi yoki placeholder ko'rsatadi.
 * Rasm bo'lmasa — logo + "pravaonline.uz" yozuvi
 * Dark/Light mode ni qo'llab-quvvatlaydi
 */
export function ImagePlaceholder({
  src,
  onClick,
  radius = "xs",
  style,
}: ImagePlaceholderProps) {
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === "dark";

  // Rasm mavjud bo'lsa — oddiy Image ko'rsatamiz
  if (src) {
    return (
      <Image
        radius={radius}
        src={src}
        style={{ cursor: onClick ? "pointer" : undefined, ...style }}
        onClick={onClick}
      />
    );
  }

  // Rasm yo'q — placeholder
  return (
    <Box
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : undefined,
        borderRadius: `var(--mantine-radius-${radius})`,
        overflow: "hidden",
        aspectRatio: "3 / 2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: isDark
          ? "linear-gradient(135deg, var(--mantine-color-dark-6) 0%, var(--mantine-color-dark-7) 100%)"
          : "linear-gradient(135deg, var(--mantine-color-gray-1) 0%, var(--mantine-color-gray-2) 100%)",
        border: `1px solid ${isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-3)"}`,
        ...style,
      }}
    >
      <Image
        src="/logo.svg"
        alt="Prava Online"
        w={64}
        h={64}
        fit="contain"
        style={{ opacity: isDark ? 0.7 : 0.5 }}
      />
      <Text
        size="lg"
        fw={700}
        c={isDark ? "dark.1" : "gray.5"}
        style={{ letterSpacing: 1, userSelect: "none" }}
      >
        pravaonline.uz
      </Text>
    </Box>
  );
}
