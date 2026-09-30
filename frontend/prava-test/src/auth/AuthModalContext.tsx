/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AUTH_LOGIN_COMPLETED_EVENT,
  clearPendingAuthRedirect,
  completePendingAuthRedirect,
  getPendingReturnUrl,
  setPendingAction,
  setPendingReturnUrl,
} from "./pendingAuthRedirect";

export interface AuthModalOptions {
  returnUrl?: string;
  pendingAction?: () => void;
  title?: string;
}

interface AuthModalContextType {
  isOpen: boolean;
  returnUrl: string | null;
  modalTitle: string | null;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
  /**
   * Call after ANY successful login. Closes the modal and runs the pending action, or navigates
   * to the remembered returnUrl, or to `fallback` (default "/me").
   */
  executePending: (fallback?: string) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(() => getPendingReturnUrl());
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const navigate = useNavigate();

  // navigate identity can change between renders; keep callbacks stable via a ref.
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    if (options?.returnUrl !== undefined) {
      setReturnUrl(setPendingReturnUrl(options.returnUrl) ?? getPendingReturnUrl());
    } else {
      setReturnUrl(getPendingReturnUrl());
    }
    if (options?.pendingAction) {
      setPendingAction(options.pendingAction);
    }
    setModalTitle(options?.title ?? null);
    setIsOpen(true);
  }, []);

  /** "Continue as guest" / Esc: the user declined, so the pending destination is dropped. */
  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    clearPendingAuthRedirect();
    setReturnUrl(null);
    setModalTitle(null);
  }, []);

  const executePending = useCallback((fallback?: string) => {
    setIsOpen(false);
    setModalTitle(null);
    setReturnUrl(null);
    completePendingAuthRedirect((to, opts) => navigateRef.current(to, opts), fallback);
  }, []);

  // Logins completed outside a component's own handler (desktop OAuth window event).
  useEffect(() => {
    const onCompleted = () => executePending();
    window.addEventListener(AUTH_LOGIN_COMPLETED_EVENT, onCompleted);
    return () => window.removeEventListener(AUTH_LOGIN_COMPLETED_EVENT, onCompleted);
  }, [executePending]);

  const value = useMemo(
    () => ({ isOpen, returnUrl, modalTitle, openAuthModal, closeAuthModal, executePending }),
    [isOpen, returnUrl, modalTitle, openAuthModal, closeAuthModal, executePending],
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
};

export function useAuthModal(): AuthModalContextType {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
