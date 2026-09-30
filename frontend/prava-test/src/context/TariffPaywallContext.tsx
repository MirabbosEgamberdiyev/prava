import { createContext, useContext, useState, type ReactNode } from "react";

export interface TariffPaywallContextValue {
  /**
   * Pullik (Malibu) tarif talab qiladigan tugma bosilganda chaqiriladi.
   * `reason` — ixtiyoriy, banner sarlavhasida ko'rsatiladigan qisqa matn.
   */
  openPaywall: (reason?: string) => void;
  closePaywall: () => void;
  isOpen: boolean;
  reason: string | undefined;
}

const TariffPaywallContext = createContext<TariffPaywallContextValue | null>(null);

export function TariffPaywallProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);

  const openPaywall = (r?: string) => {
    setReason(r);
    setIsOpen(true);
  };
  const closePaywall = () => setIsOpen(false);

  return (
    <TariffPaywallContext.Provider value={{ openPaywall, closePaywall, isOpen, reason }}>
      {children}
    </TariffPaywallContext.Provider>
  );
}

/** Istalgan komponentdan chaqirish uchun: const { openPaywall } = useTariffPaywall(); */
export function useTariffPaywall() {
  const ctx = useContext(TariffPaywallContext);
  if (!ctx) throw new Error("useTariffPaywall — TariffPaywallProvider ichida ishlatilishi kerak");
  return ctx;
}
