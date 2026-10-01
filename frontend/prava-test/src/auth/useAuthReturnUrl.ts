import { useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useAuthModal } from "./AuthModalContext";
import {
  getPendingReturnUrl,
  returnUrlQuery,
  sanitizeReturnUrl,
  setPendingReturnUrl,
} from "./pendingAuthRedirect";

type FromState = { from?: string | { pathname?: string; search?: string } } | null | undefined;

function fromLocationState(state: FromState): string | null {
  const from = state?.from;
  if (typeof from === "string") return sanitizeReturnUrl(from);
  if (from && typeof from.pathname === "string") {
    return sanitizeReturnUrl(from.pathname + (from.search || ""));
  }
  return null;
}

/**
 * For /auth/* pages (audit D-03): adopts `?returnUrl=` (or router state `from`) as the pending
 * post-login destination, and exposes a query suffix so links between login / register /
 * forgot-password keep carrying it.
 *
 * Also handles "opened while already signed in": redirects once to the pending destination.
 */
export function useAuthReturnUrl() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { executePending } = useAuthModal();

  const incoming =
    sanitizeReturnUrl(searchParams.get("returnUrl")) ?? fromLocationState(location.state as FromState);

  // Record synchronously-derived value so links rendered in this pass already carry it.
  const returnUrl = useMemo(() => incoming ?? getPendingReturnUrl(), [incoming]);

  useEffect(() => {
    if (incoming) setPendingReturnUrl(incoming);
  }, [incoming]);

  const authedAtMount = useRef(isAuthenticated);
  useEffect(() => {
    if (authedAtMount.current) executePending();
  }, [executePending]);

  return { returnUrl, query: returnUrlQuery(returnUrl) };
}
