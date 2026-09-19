import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { UserRouteFallback } from "../components/common/RouteContentFallback";

/**
 * Dedicated distraction-free layout for timed test simulations.
 * Avoids dashboard sidebar/footer interference while preserving route fallbacks.
 */
const Exam_Layout = () => {
  return (
    <div
      className="exam-route-wrapper"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Suspense fallback={<UserRouteFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default Exam_Layout;
