import { AppShell, useComputedColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router-dom";
import User_Header from "../components/nav/User_Header";
import User_Nav from "../components/nav/User_Nav";
import Footer from "../components/nav/Footer";

const User_Layout = () => {
  const [opened, { toggle }] = useDisclosure();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <AppShell
      padding="md"
      header={{ height: { base: 60 } }}
      navbar={{
        width: { base: 260 },
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
    >
      <User_Header opened={opened} toggle={toggle} />
      <User_Nav toggle={toggle} />
      <AppShell.Main
        bg={computedColorScheme === "light" ? "gray.0" : "dark.8"}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <Footer />
      </AppShell.Main>
    </AppShell>
  );
};

export default User_Layout;
