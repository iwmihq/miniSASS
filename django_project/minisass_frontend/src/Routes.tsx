import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SkeletonPage from "./components/SkeletonPage";
import { initGA, trackPageView } from "./analytics";

const NotFound = React.lazy(() => import("./pages/NotFound"));
const Howto = React.lazy(() => import("./pages/Howto"));
const Home = React.lazy(() => import("./pages/MainPage"));
const Map = React.lazy(() => import("./pages/Map"));
const DebugLinks = React.lazy(() => import("./pages/Home"));
const PasswordResetPage = React.lazy(() => import("./pages/PasswordReset"));
const RecentActivity = React.lazy(() => import("./pages/RecentActivity"));
const MobileApp = React.lazy(() => import("./pages/MobileApp"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

const ProjectRoutes = () => {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <React.Suspense fallback={<SkeletonPage />}>
      <Router>
        <RouteTracker />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/howto" element={<Howto />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/map" element={<Map />} />
            <Route path="/links" element={<DebugLinks />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/recent-activity" element={<RecentActivity />} />
            <Route path="/mobile-app" element={<MobileApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </React.Suspense>
  );
};

export default ProjectRoutes;
