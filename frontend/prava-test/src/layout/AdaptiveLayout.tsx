import { useAuth } from "../auth/AuthContext";
import App_Layout from "./App_Layout";
import User_Layout from "./User_Layout";

/**
 * AdaptiveLayout seamlessly switches between User_Layout (Dashboard AppShell)
 * when the user is logged in, and App_Layout (Public Header/Footer) when the
 * user is a guest or unauthenticated.
 * Eliminates duplicate routes and layout jumping.
 */
export default function AdaptiveLayout() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <User_Layout /> : <App_Layout />;
}
