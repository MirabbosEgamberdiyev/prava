import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import ProtectedRoute from "../auth/ProtectedRoute";
import App_Layout from "../layout/App_Layout";
import User_Layout from "../layout/User_Layout";

const Home_Page = lazy(() => import("../page/Home"));
const Login_Page = lazy(() => import("../page/Auth/login"));
const Register_Page = lazy(() => import("../page/Auth/register"));
const ForgotPassword_Page = lazy(() => import("../page/Auth/forgot-password"));
const TelegramCallback_Page = lazy(() => import("../page/Auth/telegram-callback"));
const User_Page = lazy(() => import("../page/me"));
const Packages_Page = lazy(() => import("../page/Packages"));
const PackageExamPage = lazy(() => import("../page/Packages/ExamPage"));
const Tickets_Page = lazy(() => import("../page/Ticket"));
const TicketExamPage = lazy(() => import("../page/Ticket/ExamPage"));
const Marafon_Page = lazy(() => import("../page/Marafon"));
const Exam_Page = lazy(() => import("../page/Exam"));
const ExamResult_Page = lazy(() => import("../page/ExamResult"));
const History_Page = lazy(() => import("../page/History"));
const Leaderboard_Page = lazy(() => import("../page/Leaderboard"));
const Settings_Page = lazy(() => import("../page/Settings"));
const Statistics_Page = lazy(() => import("../page/Statistics"));
const Topics_Page = lazy(() => import("../page/Topics"));
const TopicDetail_Page = lazy(() => import("../page/Topics/TopicDetail"));
const GuestExam_Page = lazy(() => import("../page/GuestExam"));
const NotFound_Page = lazy(() => import("../page/Notfound/404"));

function LoadingFallback() {
  return (
    <Center h="100vh">
      <Loader size="lg" />
    </Center>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<App_Layout />}>
          <Route index element={<Home_Page />} />
        </Route>

        <Route path="/try-exam" element={<GuestExam_Page />} />

        {/* Auth Routes */}
        <Route path="/auth" element={<App_Layout />}>
          <Route path="login" element={<Login_Page />} />
          <Route path="register" element={<Register_Page />} />
          <Route path="forgot-password" element={<ForgotPassword_Page />} />
          <Route path="telegram-callback" element={<TelegramCallback_Page />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/me" element={<User_Layout />}>
            <Route index element={<User_Page />} />
          </Route>
          <Route path="/packages" element={<User_Layout />}>
            <Route index element={<Packages_Page />} />
          </Route>
          <Route path="/tickets" element={<User_Layout />}>
            <Route index element={<Tickets_Page />} />
          </Route>
          <Route path="/history" element={<User_Layout />}>
            <Route index element={<History_Page />} />
          </Route>
          <Route path="/leaderboard" element={<User_Layout />}>
            <Route index element={<Leaderboard_Page />} />
          </Route>
          <Route path="/statistics" element={<User_Layout />}>
            <Route index element={<Statistics_Page />} />
          </Route>
          <Route path="/settings" element={<User_Layout />}>
            <Route index element={<Settings_Page />} />
          </Route>
          <Route path="/exam/result/:sessionId" element={<User_Layout />}>
            <Route index element={<ExamResult_Page />} />
          </Route>
          <Route path="/topics" element={<User_Layout />}>
            <Route index element={<Topics_Page />} />
          </Route>
          <Route path="/topics/:topicCode" element={<User_Layout />}>
            <Route index element={<TopicDetail_Page />} />
          </Route>
          <Route path="/tickets/:id" element={<TicketExamPage />} />
          <Route path="/packages/:id" element={<PackageExamPage />} />
          <Route path="/marafon" element={<Marafon_Page />} />
          <Route path="/exam" element={<Exam_Page />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound_Page />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
