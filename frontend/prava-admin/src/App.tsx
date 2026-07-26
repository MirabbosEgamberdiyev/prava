import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import App_Layout from "./layout/App_Layout";
import { AuthProvider } from "./hooks/auth/AuthContext";
import Login_Page from "./page/Auth/login";
import ProtectedRoute from "./hooks/auth/ProtectedRoute";
import RoleGuard from "./hooks/auth/RoleGuard";

// Lazy loaded sahifalar.
// Ilgari Home/Users/Questions/Topics/Packages/Tickets statik import qilingan edi
// va entry chunk ichiga tushardi — login sahifasini ochgan foydalanuvchi ham
// butun admin panelni yuklab olardi. Endi hammasi route bo'yicha bo'linadi;
// Suspense fallback App_Layout ichida markazlashtirilgan.
const Home_Page = lazy(() => import("./page/Home"));
const Users_Page = lazy(() => import("./page/Users"));
const Question_Page = lazy(() => import("./page/Questions/Question_Page"));
const Topic_Page = lazy(() => import("./page/Topics"));
const Packages_Page = lazy(() => import("./page/Packages"));
const Tickets_Page = lazy(() => import("./page/Tickets"));

const Applications_Page = lazy(() => import("./page/Applications"));
const License_Page = lazy(() => import("./page/License"));
const LearningCenters_Page = lazy(() => import("./page/LearningCenters"));
const Agreements_Page      = lazy(() => import("./page/Agreements"));
const Backup_Page = lazy(() => import("./page/Backup"));
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

                {/* Foydalanuvchilar - ADMIN va SUPER_ADMIN (backend: /api/v1/admin/users) */}
                <Route
                  path="/users"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Users_Page />
                    </RoleGuard>
                  }
                />

                {/* Savollar - ADMIN va SUPER_ADMIN (backend: /api/v1/admin/questions) */}
                <Route
                  path="/questions"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Question_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/questions/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Add_Question_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/questions/edit/:id"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Edit_Question_Page />
                    </RoleGuard>
                  }
                />

                {/* Mavzular - ADMIN va SUPER_ADMIN (backend: /api/v1/admin/topics) */}
                <Route
                  path="/topics"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Topic_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/topics/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Add_Topic_Page />
                    </RoleGuard>
                  }
                />

                {/* Paketlar - ADMIN va SUPER_ADMIN (backend: /api/v1/packages/admin) */}
                <Route
                  path="/packages"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Packages_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/packages/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Add_Package_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/packages/edit/:id"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Edit_Package_Page />
                    </RoleGuard>
                  }
                />

                {/* Biletlar - ADMIN va SUPER_ADMIN (backend: /api/v2/tickets create/update/delete) */}
                <Route
                  path="/tickets"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Tickets_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/tickets/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Add_Ticket_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/tickets/edit/:id"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Edit_Ticket_Page />
                    </RoleGuard>
                  }
                />

                {/* Ilovalar - ADMIN va SUPER_ADMIN */}
                <Route
                  path="/applications"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      
                        <Applications_Page />
                      
                    </RoleGuard>
                  }
                />

                {/* Statistika */}
                <Route
                  path="/statistics"
                  element={
                    
                      <Statistics_Page />
                    
                  }
                />

                {/* Sozlamalar */}
                <Route
                  path="/settings"
                  element={
                    
                      <Settings_Page />
                    
                  }
                />

                {/* Fayllar - ADMIN va SUPER_ADMIN */}
                <Route
                  path="/files"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      
                        <Files_Page />
                      
                    </RoleGuard>
                  }
                />

                {/* O'quv markazlari - faqat SUPER_ADMIN */}
                <Route
                  path="/learning-centers"
                  element={
                    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                      
                        <LearningCenters_Page />
                      
                    </RoleGuard>
                  }
                />

                {/* Shartnoma eslatmalari - faqat SUPER_ADMIN */}
                <Route
                  path="/agreements"
                  element={
                    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                      
                        <Agreements_Page />
                      
                    </RoleGuard>
                  }
                />

                {/* Aktivatsiya kodlari - faqat SUPER_ADMIN */}
                <Route
                  path="/license"
                  element={
                    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                      
                        <License_Page />
                      
                    </RoleGuard>
                  }
                />

                {/* Backup & Restore - faqat SUPER_ADMIN */}
                <Route
                  path="/backup"
                  element={
                    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                      
                        <Backup_Page />
                      
                    </RoleGuard>
                  }
                />

                {/* Tizim Monitoring - faqat SUPER_ADMIN */}
                <Route
                  path="/system"
                  element={
                    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
                      
                        <SystemMonitor_Page />
                      
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
