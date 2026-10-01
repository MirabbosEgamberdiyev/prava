import { useAuth } from "../auth/AuthContext";
import App_Layout from "./App_Layout";
import User_Layout from "./User_Layout";
import { isLandingDomain } from "../utils/domain";

/**
 * AdaptiveLayout seamlessly switches between User_Layout and App_Layout:
 * On web application domain (web.pravaonline.uz), always uses User_Layout matching Desktop.
 * On public landing domain (pravaonline.uz), uses App_Layout for guests.
 */
export default function AdaptiveLayout() {
  const { isAuthenticated } = useAuth();
  const isLanding = isLandingDomain();

  if (isLanding) {
    return isAuthenticated ? <User_Layout /> : <App_Layout />;
  }

  return <User_Layout />;
}
