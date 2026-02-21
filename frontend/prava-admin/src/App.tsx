import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Center, Loader } from "@mantine/core";
import App_Layout from "./layout/App_Layout";
import Home_Page from "./page/Home";
import { AuthProvider } from "./hooks/auth/AuthContext";
import Login_Page from "./page/Auth/login";
import ProtectedRoute from "./hooks/auth/ProtectedRoute";
import RoleGuard from "./hooks/auth/RoleGuard";
import Users_Page from "./page/Users";
import Question_Page from "./page/Questions/Question_Page";
import Topic_Page from "./page/Topics";
import Packages_Page from "./page/Packages";
import Tickets_Page from "./page/Tickets";

// Lazy loaded sahifalar
const Statistics_Page = lazy(() => import("./page/Statistics"));
const Settings_Page = lazy(() => import("./page/Settings"));
const SystemMonitor_Page = lazy(() => import("./page/SystemMonitor"));
const Files_Page = lazy(() => import("./page/Files"));
const Add_Question_Page = lazy(() => import("./page/Questions/Add_Question_Page/Add_Question_Page"));
const Edit_Question_Page = lazy(() => import("./page/Questions/Edit_Question_Page/Edit_Question_Page"));
const Add_Topic_Page = lazy(() => import("./page/Topics/Add_Topic_Page"));
const Add_Package_Page = lazy(() => import("./page/Packages/Add_Package_Page/Add_Package_Page"));
const Edit_Package_Page = lazy(() => import("./page/Packages/Edit_Package_Page/Edit_Package_Page"));
const Add_Ticket_Page = lazy(() => import("./page/Tickets/Add_Ticket_Page/Add_Ticket_Page"));
const Edit_Ticket_Page = lazy(() => import("./page/Tickets/Edit_Ticket_Page/Edit_Ticket_Page"));

const LazyFallback = (
  <Center h={400}>
    <Loader type="bars" />
  </Center>
);

function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth/login" element={<Login_Page />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<App_Layout />}>
                <Route index element={<Home_Page />} />
                <Route path="/users" element={<Users_Page />} />
                <Route path="/questions" element={<Question_Page />} />
                <Route path="/questions/add" element={<Suspense fallback={LazyFallback}><Add_Question_Page /></Suspense>} />
                <Route
                  path="/questions/edit/:id"
                  element={<Suspense fallback={LazyFallback}><Edit_Question_Page /></Suspense>}
                />
                <Route path="/topics" element={<Topic_Page />} />
                <Route path="/topics/add" element={<Suspense fallback={LazyFallback}><Add_Topic_Page /></Suspense>} />

                <Route path="/packages" element={<Packages_Page />} />
                <Route path="/packages/add" element={<Suspense fallback={LazyFallback}><Add_Package_Page /></Suspense>} />
                <Route
                  path="/packages/edit/:id"
                  element={<Suspense fallback={LazyFallback}><Edit_Package_Page /></Suspense>}
                />

                <Route path="/tickets" element={<Tickets_Page />} />
                <Route path="/tickets/add" element={<Suspense fallback={LazyFallback}><Add_Ticket_Page /></Suspense>} />
                <Route
                  path="/tickets/edit/:id"
                  element={<Suspense fallback={LazyFallback}><Edit_Ticket_Page /></Suspense>}
                />

                {/* Statistika */}
                <Route
                  path="/statistics"
                  element={
                    <Suspense fallback={LazyFallback}>
                      <Statistics_Page />
                    </Suspense>
                  }
                />

                {/* Sozlamalar */}
                <Route
                  path="/settings"
                  element={
                    <Suspense fallback={LazyFallback}>
                      <Settings_Page />
                    </Suspense>
                  }
                />

                {/* Fayllar - ADMIN va SUPER_ADMIN */}
                <Route
                  path="/files"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Suspense fallback={LazyFallback}>
                        <Files_Page />
                      </Suspense>
                    </RoleGuard>
                  }
                />

                {/* Tizim Monitoring - faqat SUPER_ADMIN */}
                <Route
                  path="/system"
                  element={
                    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                      <Suspense fallback={LazyFallback}>
                        <SystemMonitor_Page />
                      </Suspense>
                    </RoleGuard>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
