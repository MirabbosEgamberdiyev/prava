import { Suspense } from "react";
import { AppShell, Center, Loader, useComputedColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router-dom";
import App_Header from "../components/nav/App_Header";
import App_Nav from "../components/nav/App_Nav";
import AppBreadcrumbs from "../components/nav/AppBreadcrumbs";

const App_Layout = () => {
  const [opened, { toggle, close }] = useDisclosure();
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

        {/*
          Ilgari `toggle` uzatilardi: desktopda menyu bandini bosish
          `opened` ni `true` ga o'girib qo'yardi va keyin ekran mobilga
          o'tganda navbar ochiq holda qolardi. Navigatsiyada faqat yopish kerak.
        */}
        <App_Nav close={close} />
        <AppShell.Main
          bg={computedColorScheme === "light" ? "gray.1" : "dark.8"}
        >
          <AppBreadcrumbs />
          {/*
            Bitta markaziy Suspense: App.tsx da har bir route uchun alohida
            <Suspense> takrorlanardi, endi barcha lazy sahifalar shu yerdan
            fallback oladi.
          */}
          <Suspense
            fallback={
              <Center h={400}>
                <Loader type="bars" />
              </Center>
            }
          >
            <Outlet />
          </Suspense>
        </AppShell.Main>
      </AppShell>
    </>
  );
};

export default App_Layout;
