import { Component, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";
import { IconArrowLeft } from "@tabler/icons-react";
import "./simulator.css";

interface Props extends WithTranslation {
  children: ReactNode;
  onBack: () => void;
}

/**
 * Simulyator alohida chunk sifatida yuklanadi. Agar o'sha fayl yuklanmasa
 * yoki 3D ishga tushmasa, React butun daraxtni yechib tashlaydi va
 * foydalanuvchi OQ EKRAN ko'radi. Bu chegara shunday holatda tushunarli
 * xabar va "Chiqish" tugmasini ko'rsatadi.
 */
class SimulatorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err: unknown) {
    console.error("Simulyator yuklanmadi:", err);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { t, onBack } = this.props;
    return (
      <div className="sim-screen sim-nogl">
        <div className="sim-nogl-box">
          <h2>{t("sim.loadFailTitle")}</h2>
          <p>{t("sim.loadFailDesc")}</p>
          <button className="sim-btn" onClick={onBack}>
            <IconArrowLeft size={18} /> {t("sim.exit")}
          </button>
        </div>
      </div>
    );
  }
}

export default withTranslation()(SimulatorBoundary);
