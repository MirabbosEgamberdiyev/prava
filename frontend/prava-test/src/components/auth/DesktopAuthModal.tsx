import { useEffect } from "react";
import { useAuthModal } from "../../auth/AuthModalContext";
import UnifiedAuthCard from "./UnifiedAuthCard";
import "../../styles/desktop-auth-modal.css";

export default function DesktopAuthModal() {
  const { isOpen, closeAuthModal } = useAuthModal();

  // Esc key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAuthModal]);

  if (!isOpen) return null;

  return (
    <div
      className="dam-backdrop"
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
    >
      <div className="dam-modal-simple" onClick={(e) => e.stopPropagation()}>
        <UnifiedAuthCard mode="modal" onClose={closeAuthModal} />
      </div>
    </div>
  );
}
