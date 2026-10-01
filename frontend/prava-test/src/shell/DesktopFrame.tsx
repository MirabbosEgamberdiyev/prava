import type { ReactNode } from "react";
import TitleBar from "./TitleBar";
import GlobalHotkeys from "./GlobalHotkeys";
import DesktopAuthModal from "../components/auth/DesktopAuthModal";
import "./shell.css";

/**
 * Window chrome for every route (auth pages included — the window is frameless, so the
 * caption must always be present): titlebar · content, plus the global hotkeys.
 */
export default function DesktopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="shell-frame">
      <TitleBar />
      <div className="shell-body">{children}</div>
      <GlobalHotkeys />
      <DesktopAuthModal />
    </div>
  );
}

