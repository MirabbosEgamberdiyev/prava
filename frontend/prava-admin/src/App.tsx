import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";
import App_Layout from "./layout/App_Layout";
import { AuthProvider } from "./hooks/auth/AuthContext";
import { TypographyProvider } from "./context/TypographyContext";
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

const Exams_Page = lazy(() => import("./page/Exams"));
const Contact_Page = lazy(() => import("./page/Contact"));
const Partners_Page = lazy(() => import("./page/Partners"));
const Downloads_Page = lazy(() => import("./page/Downloads"));
const News_Page = lazy(() => import("./page/News"));
const Faq_Page = lazy(() => import("./page/Faq"));
const Audit_Page = lazy(() => import("./page/Audit"));

// Curriculum Pages (YHQ, Yo'l belgilari, chiziqlar, jarimalar, avtodrom, imtihon markazlari)
const Signs_Page = lazy(() => import("./page/Curriculum/SignsPage"));
const Markings_Page = lazy(() => import("./page/Curriculum/MarkingsPage"));
const Rules_Page = lazy(() => import("./page/Curriculum/RulesPage"));
const Fines_Page = lazy(() => import("./page/Curriculum/FinesPage"));
const Autodrom_Page = lazy(() => import("./page/Curriculum/AutodromPage"));
const ExamCenters_Page = lazy(() => import("./page/Curriculum/ExamCentersPage"));

function App() {
  return (
    <>
      <BrowserRouter>
        <TypographyProvider>
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

                {/* Savollar - ADMIN, SUPER_ADMIN va CONTENT_MANAGER (backend: /api/v1/admin/questions) */}
                <Route
                  path="/questions"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Question_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/questions/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Add_Question_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/questions/edit/:id"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Edit_Question_Page />
                    </RoleGuard>
                  }
                />

                {/* Mavzular - ADMIN, SUPER_ADMIN va CONTENT_MANAGER (backend: /api/v1/admin/topics) */}
                <Route
                  path="/topics"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Topic_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/topics/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Add_Topic_Page />
                    </RoleGuard>
                  }
                />

                {/* Paketlar - ADMIN, SUPER_ADMIN va CONTENT_MANAGER (backend: /api/v1/packages/admin) */}
                <Route
                  path="/packages"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Packages_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/packages/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Add_Package_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/packages/edit/:id"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Edit_Package_Page />
                    </RoleGuard>
                  }
                />

                {/* Biletlar - ADMIN, SUPER_ADMIN va CONTENT_MANAGER (backend: /api/v2/tickets) */}
                <Route
                  path="/tickets"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Tickets_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/tickets/add"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Add_Ticket_Page />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/tickets/edit/:id"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Edit_Ticket_Page />
                    </RoleGuard>
                  }
                />

                {/* Yo'l belgilari - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/signs"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Signs_Page />
                    </RoleGuard>
                  }
                />

                {/* Yo'l chiziqlari - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/markings"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Markings_Page />
                    </RoleGuard>
                  }
                />

                {/* Yo'l harakati qoidalari - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/rules"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Rules_Page />
                    </RoleGuard>
                  }
                />

                {/* Jarimalar & Qoidabuzarliklar - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/fines"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Fines_Page />
                    </RoleGuard>
                  }
                />

                {/* Avtodrom & Amaliy mashqlar - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/autodrom"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Autodrom_Page />
                    </RoleGuard>
                  }
                />

                {/* Imtihon markazlari - ADMIN va SUPER_ADMIN */}
                <Route
                  path="/exam-centers"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <ExamCenters_Page />
                    </RoleGuard>
                  }
                />

                {/* Imtihonlar auditi - ADMIN, SUPER_ADMIN va ANALYST */}
                <Route
                  path="/exams"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "ANALYST"]}>
                      <Exams_Page />
                    </RoleGuard>
                  }
                />

                {/* Murojaatlar CRM - ADMIN, SUPER_ADMIN va SUPPORT */}
                <Route
                  path="/contact"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "SUPPORT"]}>
                      <Contact_Page />
                    </RoleGuard>
                  }
                />

                {/* Hamkorlar CRM - ADMIN, SUPER_ADMIN va SUPPORT */}
                <Route
                  path="/partners"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "SUPPORT"]}>
                      <Partners_Page />
                    </RoleGuard>
                  }
                />

                {/* Yuklab olishlar - ADMIN, SUPER_ADMIN va ANALYST */}
                <Route
                  path="/downloads"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "ANALYST"]}>
                      <Downloads_Page />
                    </RoleGuard>
                  }
                />

                {/* Yangiliklar CMS - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/news"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <News_Page />
                    </RoleGuard>
                  }
                />

                {/* FAQ CMS - ADMIN, SUPER_ADMIN va CONTENT_MANAGER */}
                <Route
                  path="/faq"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTENT_MANAGER"]}>
                      <Faq_Page />
                    </RoleGuard>
                  }
                />

                {/* Audit jurnali - faqat ADMIN va SUPER_ADMIN */}
                <Route
                  path="/audit"
                  element={
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                      <Audit_Page />
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
                    <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "ANALYST"]}>
                      <Statistics_Page />
                    </RoleGuard>
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
                <Route
                  path="/system-monitor"
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
      </TypographyProvider>
    </BrowserRouter>
    </>
  );
}

export default App;
