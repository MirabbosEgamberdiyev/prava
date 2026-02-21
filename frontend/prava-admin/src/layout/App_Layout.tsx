import { AppShell, useComputedColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router-dom";
import App_Header from "../components/nav/App_Header";
import App_Nav from "../components/nav/App_Nav";

const App_Layout = () => {
  const [opened, { toggle }] = useDisclosure();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: { base: 260, md: 280, lg: 300 },
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <App_Header opened={opened} toggle={toggle} />

        <App_Nav toggle={toggle} />
        <AppShell.Main
          bg={computedColorScheme === "light" ? "gray.1" : "dark.8"}
        >
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </>
  );
};

export default App_Layout;
