import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { nprogress } from "@mantine/nprogress";
import ProtectedRoute from "../auth/ProtectedRoute";
import AdminRoute from "../auth/AdminRoute";
import App_Layout from "../layout/App_Layout";
import User_Layout from "../layout/User_Layout";
import Exam_Layout from "../layout/Exam_Layout";
import AdaptiveLayout from "../layout/AdaptiveLayout";
import { isLandingDomain } from "../utils/domain";
import {
  DomainRedirectToWebApp,
  DomainRedirectToLanding,
} from "../components/common/DomainRedirect";
import { useAuth } from "../auth/AuthContext";

const Home_Page = lazy(() => import("../page/Home"));
const Login_Page = lazy(() => import("../page/Auth/login"));
const Register_Page = lazy(() => import("../page/Auth/register"));
const ForgotPassword_Page = lazy(() => import("../page/Auth/forgot-password"));
const TelegramCallback_Page = lazy(() => import("../page/Auth/telegram-callback"));
const Pair_Page = lazy(() => import("../page/Auth/pair"));
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
const PaymentSuccessPage = lazy(() => import("../payment/PaymentSuccessPage"));
const ActivationCodesPage = lazy(() => import("../page/Admin/ActivationCodes"));
const Downloads_Page      = lazy(() => import("../page/Downloads"));
const Partners_Page       = lazy(() => import("../page/Partners"));
const About_Page          = lazy(() => import("../page/About"));
const Contact_Page        = lazy(() => import("../page/Contact"));
const FAQ_Page            = lazy(() => import("../page/FAQ"));
const Terms_Page          = lazy(() => import("../page/Legal/Terms"));
const Privacy_Page        = lazy(() => import("../page/Legal/Privacy"));
const Offer_Page          = lazy(() => import("../page/Legal/Offer"));
// const Pricing_Page        = lazy(() => import("../page/Pricing")); // Temporarily disabled per user request
const WrongAnswers_Page   = lazy(() => import("../page/WrongAnswers"));
const WrongExam_Page      = lazy(() => import("../page/WrongExam"));
const SavedQuestions_Page = lazy(() => import("../page/SavedQuestions"));
const RoadSigns_Page      = lazy(() => import("../page/RoadSigns"));
const RoadMarkings_Page   = lazy(() => import("../page/RoadMarkings"));
const ExamCenters_Page    = lazy(() => import("../page/ExamCenters"));
const PracticalExam_Page  = lazy(() => import("../page/PracticalExam"));
const TrafficRules_Page   = lazy(() => import("../page/TrafficRules"));
const Penalties_Page      = lazy(() => import("../page/Penalties"));

function RootLoadingFallback() {
  useEffect(() => {
    nprogress.start();
    return () => {
      nprogress.complete();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #1a1b1e)",
      }}
    >
      <div className="spinner" />
    </div>
  );
}

/**
 * Web Application Entry Gateway:
 * - If user is authenticated -> /me (dashboard)
 * - If user is unauthenticated -> /auth/login
 */
function WebAppRoot() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/me" : "/auth/login"} replace />;
}

export default function AppRoutes() {
  const isLanding = isLandingDomain();
  const isLocalUnified =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1") &&
    !new URLSearchParams(window.location.search).has("mode") &&
    !new URLSearchParams(window.location.search).has("app_mode");

  return (
    <Suspense fallback={<RootLoadingFallback />}>
      <Routes>
        {/* ================================================================= */}
        {/* SCENARIO A: STRICT PUBLIC LANDING DOMAIN (pravaonline.uz)          */}
        {/* ================================================================= */}
        {isLanding && !isLocalUnified && (
          <>
            {/* Public Landing Pages */}
            <Route path="/" element={<App_Layout />}>
              <Route index element={<Home_Page />} />
              <Route path="partners" element={<Partners_Page />} />
              <Route path="pricing" element={<Navigate to="/partners" replace />} />
              <Route path="tariffs" element={<Navigate to="/partners" replace />} />
              <Route path="downloads" element={<Downloads_Page />} />
              <Route path="about" element={<About_Page />} />
              <Route path="contact" element={<Contact_Page />} />
              <Route path="faq" element={<FAQ_Page />} />
              <Route path="terms" element={<Terms_Page />} />
              <Route path="privacy" element={<Privacy_Page />} />
              <Route path="offer" element={<Offer_Page />} />
              <Route path="signs" element={<RoadSigns_Page />} />
              <Route path="markings" element={<RoadMarkings_Page />} />
              <Route path="exam-centers" element={<ExamCenters_Page />} />
              <Route path="practical-exam" element={<PracticalExam_Page />} />
              <Route path="rules" element={<TrafficRules_Page />} />
              <Route path="penalties" element={<Penalties_Page />} />
            </Route>

            {/* Public Free Guest Trial Exam */}
            <Route path="/try-exam" element={<GuestExam_Page />} />

            {/* Seamless Redirects for Web App Routes -> https://web.pravaonline.uz */}
            <Route path="/auth/*" element={<DomainRedirectToWebApp />} />
            <Route path="/me" element={<DomainRedirectToWebApp targetPath="/me" />} />
            <Route path="/tickets" element={<DomainRedirectToWebApp targetPath="/tickets" />} />
            <Route path="/tickets/*" element={<DomainRedirectToWebApp />} />
            <Route path="/packages" element={<DomainRedirectToWebApp targetPath="/packages" />} />
            <Route path="/packages/*" element={<DomainRedirectToWebApp />} />
            <Route path="/topics" element={<DomainRedirectToWebApp targetPath="/topics" />} />
            <Route path="/topics/*" element={<DomainRedirectToWebApp />} />
            <Route path="/marafon" element={<DomainRedirectToWebApp targetPath="/marafon" />} />
            <Route path="/exam" element={<DomainRedirectToWebApp targetPath="/exam" />} />
            <Route path="/exam/*" element={<DomainRedirectToWebApp />} />
            <Route path="/wrong-answers" element={<DomainRedirectToWebApp targetPath="/wrong-answers" />} />
            <Route path="/wrong-exam" element={<DomainRedirectToWebApp targetPath="/wrong-exam" />} />
            <Route path="/saved-questions" element={<DomainRedirectToWebApp targetPath="/saved-questions" />} />
            <Route path="/statistics" element={<DomainRedirectToWebApp targetPath="/statistics" />} />
            <Route path="/history" element={<DomainRedirectToWebApp targetPath="/history" />} />
            <Route path="/leaderboard" element={<DomainRedirectToWebApp targetPath="/leaderboard" />} />
            <Route path="/settings" element={<DomainRedirectToWebApp targetPath="/settings" />} />
            <Route path="/payment/*" element={<DomainRedirectToWebApp />} />
            <Route path="/admin/*" element={<DomainRedirectToWebApp />} />

            {/* 404 for unknown landing routes */}
            <Route element={<App_Layout />}>
              <Route path="*" element={<NotFound_Page />} />
            </Route>
          </>
        )}

        {/* ================================================================= */}
        {/* SCENARIO B: STRICT FULL WEB APPLICATION (web.pravaonline.uz)       */}
        {/* ================================================================= */}
        {!isLanding && !isLocalUnified && (
          <>
            {/* Web App Root - authenticated -> /me, unauthenticated -> /auth/login */}
            <Route path="/" element={<WebAppRoot />} />

            {/* Public Free Guest Trial Exam */}
            <Route path="/try-exam" element={<GuestExam_Page />} />

            {/* Marketing Routes Redirect to Official Landing -> https://pravaonline.uz */}
            <Route path="/partners" element={<DomainRedirectToLanding targetPath="/partners" />} />
            <Route path="/pricing" element={<DomainRedirectToLanding targetPath="/partners" />} />
            <Route path="/tariffs" element={<DomainRedirectToLanding targetPath="/partners" />} />
            <Route path="/downloads" element={<DomainRedirectToLanding targetPath="/downloads" />} />
            <Route path="/about" element={<DomainRedirectToLanding targetPath="/about" />} />
            <Route path="/contact" element={<DomainRedirectToLanding targetPath="/contact" />} />
            <Route path="/faq" element={<DomainRedirectToLanding targetPath="/faq" />} />

            {/* Legal Routes directly accessible within Web App */}
            <Route element={<App_Layout />}>
              <Route path="/terms" element={<Terms_Page />} />
              <Route path="/privacy" element={<Privacy_Page />} />
              <Route path="/offer" element={<Offer_Page />} />
            </Route>

            {/* Curriculum Routes with Adaptive Layout (User_Layout when authenticated, App_Layout when guest) */}
            <Route element={<AdaptiveLayout />}>
              <Route path="/signs" element={<RoadSigns_Page />} />
              <Route path="/markings" element={<RoadMarkings_Page />} />
              <Route path="/exam-centers" element={<ExamCenters_Page />} />
              <Route path="/practical-exam" element={<PracticalExam_Page />} />
              <Route path="/rules" element={<TrafficRules_Page />} />
              <Route path="/penalties" element={<Penalties_Page />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/auth" element={<App_Layout />}>
              <Route path="login" element={<Login_Page />} />
              <Route path="register" element={<Register_Page />} />
              <Route path="forgot-password" element={<ForgotPassword_Page />} />
              <Route path="reset-password" element={<ForgotPassword_Page />} />
              <Route path="verify-email" element={<Register_Page />} />
              <Route path="verify-sms" element={<Register_Page />} />
              <Route path="telegram-callback" element={<TelegramCallback_Page />} />
              <Route path="pair" element={<Pair_Page />} />
            </Route>

            {/* Direct Auth Aliases */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/register" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
            <Route path="/verify-email" element={<Navigate to="/auth/register" replace />} />
            <Route path="/verify-sms" element={<Navigate to="/auth/register" replace />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard AppShell Layout */}
              <Route element={<User_Layout />}>
                <Route path="/me" element={<User_Page />} />
                <Route path="/packages" element={<Packages_Page />} />
                <Route path="/tickets" element={<Tickets_Page />} />
                <Route path="/history" element={<History_Page />} />
                <Route path="/leaderboard" element={<Leaderboard_Page />} />
                <Route path="/statistics" element={<Statistics_Page />} />
                <Route path="/settings" element={<Settings_Page />} />
                <Route path="/wrong-answers" element={<WrongAnswers_Page />} />
                <Route path="/saved-questions" element={<SavedQuestions_Page />} />
                <Route path="/topics" element={<Topics_Page />} />
                <Route path="/topics/:topicCode" element={<TopicDetail_Page />} />

                {/* Sub-route aliases under /me */}
                <Route path="/me/topics" element={<Navigate to="/topics" replace />} />
                <Route path="/me/tickets" element={<Navigate to="/tickets" replace />} />
                <Route path="/me/marafon" element={<Navigate to="/marafon" replace />} />
                <Route path="/me/marathon" element={<Navigate to="/marafon" replace />} />
                <Route path="/me/exam" element={<Navigate to="/exam" replace />} />
                <Route path="/me/statistics" element={<Navigate to="/statistics" replace />} />
                <Route path="/me/history" element={<Navigate to="/history" replace />} />
                <Route path="/me/leaderboard" element={<Navigate to="/leaderboard" replace />} />
                <Route path="/me/ranking" element={<Navigate to="/leaderboard" replace />} />
                <Route path="/me/saved-questions" element={<Navigate to="/saved-questions" replace />} />
                <Route path="/me/saved" element={<Navigate to="/saved-questions" replace />} />
                <Route path="/me/bookmarks" element={<Navigate to="/saved-questions" replace />} />
                <Route path="/me/wrong-answers" element={<Navigate to="/wrong-answers" replace />} />
                <Route path="/me/errors" element={<Navigate to="/wrong-answers" replace />} />
                <Route path="/me/settings" element={<Navigate to="/settings" replace />} />
                <Route path="/me/packages" element={<Navigate to="/packages" replace />} />
              </Route>

              {/* Distraction-Free Exam Simulation Layout */}
              <Route element={<Exam_Layout />}>
                <Route path="/tickets/:id" element={<TicketExamPage />} />
                <Route path="/packages/:id" element={<PackageExamPage />} />
                <Route path="/marafon" element={<Marafon_Page />} />
                <Route path="/exam" element={<Exam_Page />} />
                <Route path="/wrong-exam" element={<WrongExam_Page />} />
                <Route path="/exam/result/:sessionId" element={<ExamResult_Page />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
              </Route>
            </Route>

            {/* SUPER_ADMIN only routes */}
            <Route element={<AdminRoute />}>
              <Route element={<User_Layout />}>
                <Route path="/admin/activation-codes" element={<ActivationCodesPage />} />
              </Route>
            </Route>

            {/* 404 for unknown web app routes */}
            <Route element={<App_Layout />}>
              <Route path="*" element={<NotFound_Page />} />
            </Route>
          </>
        )}

        {/* ================================================================= */}
        {/* SCENARIO C: LOCALHOST UNIFIED DEVELOPMENT MODE                     */}
        {/* (Provides instant local access to both landing and app for dev)   */}
        {/* ================================================================= */}
        {isLocalUnified && (
          <>
            {/* Public Routes */}
            <Route path="/" element={<App_Layout />}>
              <Route index element={<Home_Page />} />
              <Route path="partners" element={<Partners_Page />} />
              <Route path="pricing" element={<Navigate to="/partners" replace />} />
              <Route path="tariffs" element={<Navigate to="/partners" replace />} />
              <Route path="downloads" element={<Downloads_Page />} />
              <Route path="about" element={<About_Page />} />
              <Route path="contact" element={<Contact_Page />} />
              <Route path="faq" element={<FAQ_Page />} />
              <Route path="terms" element={<Terms_Page />} />
              <Route path="privacy" element={<Privacy_Page />} />
              <Route path="offer" element={<Offer_Page />} />
            </Route>

            {/* Curriculum Routes with Adaptive Layout (User_Layout when authenticated, App_Layout when guest) */}
            <Route element={<AdaptiveLayout />}>
              <Route path="/signs" element={<RoadSigns_Page />} />
              <Route path="/markings" element={<RoadMarkings_Page />} />
              <Route path="/exam-centers" element={<ExamCenters_Page />} />
              <Route path="/practical-exam" element={<PracticalExam_Page />} />
              <Route path="/rules" element={<TrafficRules_Page />} />
              <Route path="/penalties" element={<Penalties_Page />} />
            </Route>

            <Route path="/try-exam" element={<GuestExam_Page />} />

            {/* Auth Routes */}
            <Route path="/auth" element={<App_Layout />}>
              <Route path="login" element={<Login_Page />} />
              <Route path="register" element={<Register_Page />} />
              <Route path="forgot-password" element={<ForgotPassword_Page />} />
              <Route path="reset-password" element={<ForgotPassword_Page />} />
              <Route path="verify-email" element={<Register_Page />} />
              <Route path="verify-sms" element={<Register_Page />} />
              <Route path="telegram-callback" element={<TelegramCallback_Page />} />
              <Route path="pair" element={<Pair_Page />} />
            </Route>

            {/* Direct Auth Aliases */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/register" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
            <Route path="/verify-email" element={<Navigate to="/auth/register" replace />} />
            <Route path="/verify-sms" element={<Navigate to="/auth/register" replace />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard AppShell Layout */}
              <Route element={<User_Layout />}>
                <Route path="/me" element={<User_Page />} />
                <Route path="/packages" element={<Packages_Page />} />
                <Route path="/tickets" element={<Tickets_Page />} />
                <Route path="/history" element={<History_Page />} />
                <Route path="/leaderboard" element={<Leaderboard_Page />} />
                <Route path="/statistics" element={<Statistics_Page />} />
                <Route path="/settings" element={<Settings_Page />} />
                <Route path="/wrong-answers" element={<WrongAnswers_Page />} />
                <Route path="/saved-questions" element={<SavedQuestions_Page />} />
                <Route path="/topics" element={<Topics_Page />} />
                <Route path="/topics/:topicCode" element={<TopicDetail_Page />} />

                {/* Sub-route aliases under /me */}
                <Route path="/me/topics" element={<Navigate to="/topics" replace />} />
                <Route path="/me/tickets" element={<Navigate to="/tickets" replace />} />
                <Route path="/me/marafon" element={<Navigate to="/marafon" replace />} />
                <Route path="/me/marathon" element={<Navigate to="/marafon" replace />} />
                <Route path="/me/exam" element={<Navigate to="/exam" replace />} />
                <Route path="/me/statistics" element={<Navigate to="/statistics" replace />} />
                <Route path="/me/history" element={<Navigate to="/history" replace />} />
                <Route path="/me/leaderboard" element={<Navigate to="/leaderboard" replace />} />
                <Route path="/me/ranking" element={<Navigate to="/leaderboard" replace />} />
                <Route path="/me/saved-questions" element={<Navigate to="/saved-questions" replace />} />
                <Route path="/me/saved" element={<Navigate to="/saved-questions" replace />} />
                <Route path="/me/bookmarks" element={<Navigate to="/saved-questions" replace />} />
                <Route path="/me/wrong-answers" element={<Navigate to="/wrong-answers" replace />} />
                <Route path="/me/errors" element={<Navigate to="/wrong-answers" replace />} />
                <Route path="/me/settings" element={<Navigate to="/settings" replace />} />
                <Route path="/me/packages" element={<Navigate to="/packages" replace />} />
              </Route>

              {/* Distraction-Free Exam Simulation Layout */}
              <Route element={<Exam_Layout />}>
                <Route path="/tickets/:id" element={<TicketExamPage />} />
                <Route path="/packages/:id" element={<PackageExamPage />} />
                <Route path="/marafon" element={<Marafon_Page />} />
                <Route path="/exam" element={<Exam_Page />} />
                <Route path="/wrong-exam" element={<WrongExam_Page />} />
                <Route path="/exam/result/:sessionId" element={<ExamResult_Page />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
              </Route>
            </Route>

            {/* SUPER_ADMIN only routes */}
            <Route element={<AdminRoute />}>
              <Route element={<User_Layout />}>
                <Route path="/admin/activation-codes" element={<ActivationCodesPage />} />
              </Route>
            </Route>

            {/* 404 Not Found */}
            <Route element={<App_Layout />}>
              <Route path="*" element={<NotFound_Page />} />
            </Route>
          </>
        )}
      </Routes>
    </Suspense>
  );
}
