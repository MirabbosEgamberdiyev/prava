import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";
import { setPendingReturnUrl } from "./pendingAuthRedirect";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const location = useLocation();
  const intended = location.pathname + location.search;

  useEffect(() => {
    if (isAuthenticated) return;
    const hasLang = !!localStorage.getItem("prava_lang_selected");
    if (hasLang) {
      // Records the intended destination (sessionStorage mirror) and asks for login.
      openAuthModal({ returnUrl: intended });
    } else {
      // First launch: language picker first; the destination is kept for after login.
      setPendingReturnUrl(intended);
    }
  }, [isAuthenticated, intended, openAuthModal]);

  if (!isAuthenticated) {
    const hasLang = !!localStorage.getItem("prava_lang_selected");
    if (!hasLang) {
      return <Navigate to="/auth/language" state={{ from: location }} replace />;
    }

    // Fallback to parent category screen so user can browse in guest mode
    if (location.pathname.startsWith("/tickets/")) {
      return <Navigate to="/tickets" replace />;
    }
    if (location.pathname.startsWith("/packages/")) {
      return <Navigate to="/packages" replace />;
    }
    return <Navigate to="/me" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
