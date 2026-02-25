import {
  useMantineColorScheme,
  useComputedColorScheme,
  ActionIcon,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

const ColorMode = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  return (
    <>
      <ActionIcon
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
        variant="light"
        radius={'sm'}
        size="lg"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === "light" ? (
          <IconMoon stroke={1.5} size={18} />
        ) : (
          <IconSun stroke={1.5} size={18} />
        )}
      </ActionIcon>
    </>
  );
};

export default ColorMode;
