import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "blue",
  fontFamily: '"Montserrat", sans-serif',
  headings: {
    fontFamily: '"Montserrat", sans-serif',
    sizes: {
      h1: { fontSize: "2rem", lineHeight: "1.3" },
      h2: { fontSize: "1.625rem", lineHeight: "1.35" },
      h3: { fontSize: "1.375rem", lineHeight: "1.4" },
      h4: { fontSize: "1.125rem", lineHeight: "1.45" },
    },
  },
  defaultRadius: "md",
  components: {
    Button: { defaultProps: { radius: "md" } },
    Card: { defaultProps: { radius: "md" } },
    Paper: { defaultProps: { radius: "md" } },
    Modal: { defaultProps: { radius: "md" } },
  },
});
