import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";
import Footer from "../components/nav/Footer";
import { useDisclosure } from "@mantine/hooks";
import Navbar from "@/components/nav/Navbar";
import Header from "@/components/nav/Header";

const App_Layout = () => {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <Header opened={opened} toggle={toggle} />
      <Navbar close={close} />
      <AppShell.Main
        px={0}
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

export default App_Layout;
