import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const location = useLocation();
  const intended = location.pathname + location.search;

  useEffect(() => {
    if (isAuthenticated) return;
    openAuthModal({ returnUrl: intended });
  }, [isAuthenticated, intended, openAuthModal]);

  if (!isAuthenticated) {
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
