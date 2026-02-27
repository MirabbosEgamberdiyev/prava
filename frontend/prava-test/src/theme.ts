import { createTheme, type MantineColorsTuple } from "@mantine/core";

const primaryBlue: MantineColorsTuple = [
  "#e7f5ff",
  "#d0ebff",
  "#a5d8ff",
  "#74c0fc",
  "#4dabf7",
  "#339af0",
  "#228be6",
  "#1c7ed6",
  "#1971c2",
  "#1864ab",
];

export const theme = createTheme({
  primaryColor: "blue",
  colors: {
    blue: primaryBlue,
  },
  fontFamily: '"Montserrat", sans-serif',
  headings: {
    fontFamily: '"Montserrat", sans-serif',
    sizes: {
      h1: { fontSize: "2.125rem", lineHeight: "1.3" },
      h2: { fontSize: "1.625rem", lineHeight: "1.35" },
      h3: { fontSize: "1.325rem", lineHeight: "1.4" },
      h4: { fontSize: "1.125rem", lineHeight: "1.45" },
    },
  },
  defaultRadius: "sm",
});
