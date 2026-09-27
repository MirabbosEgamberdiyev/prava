import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { loginPath } from "../utils/returnTo";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // W-06: himoyalangan sahifa manzili `?returnTo=` sifatida login'ga uzatiladi
    // (yagona manba; login/ro'yxatdan o'tish/Google/Telegram oqimlari shuni o'qiydi).
    return (
      <Navigate
        to={loginPath(location.pathname + location.search)}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
