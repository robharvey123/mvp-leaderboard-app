// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts & route guards
import SidebarLayout from "@/components/SidebarLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";

// Marketing / public
import LandingPage from "@/pages/LandingPage";
import DemoPage from "@/pages/DemoPage";
import { ContactPage } from "@/pages/ContactPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { TermsPage } from "@/pages/TermsPage";

// Public auth pages
import SignInPage from "@/pages/auth/SignInPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import UpdatePasswordPage from "@/pages/auth/UpdatePasswordPage";
import AcceptInvitePage from "@/pages/auth/AcceptInvitePage";

// App pages
import HomePage from "@/pages/HomePage";
import AccountPage from "@/pages/AccountPage";
import ClubOverview from "@/pages/analytics/ClubOverview";
import SeasonDashboard from "@/pages/analytics/SeasonDashboard";
import TeamStats from "@/pages/analytics/TeamStats";
import PlayerExplorer from "@/pages/analytics/PlayerExplorer";
import CategoryBreakdown from "@/pages/analytics/CategoryBreakdown";
import ScoringConfigPage from "@/pages/admin/ScoringConfigPage";
import ImportPage from "@/pages/admin/ImportPage";
import PlayCricketIntegrationPage from "@/pages/admin/PlayCricketIntegrationPage";
import ClubAdminPage from "@/pages/admin/ClubAdminPage";

function NotFound() {
  return <div className="p-6">Page not found.</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<LandingPage />} />

      {/* Public marketing pages */}
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Auth routes */}
      <Route path="/auth/sign-in" element={<SignInPage />} />
      <Route path="/auth/sign-up" element={<SignUpPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
      <Route path="/accept" element={<AcceptInvitePage />} />

      {/* Protected shell for the actual app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <SidebarLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="account" element={<AccountPage />} />

        {/* Analytics */}
        <Route path="analytics/club" element={<ClubOverview />} />
        <Route path="analytics/season" element={<SeasonDashboard />} />
        <Route path="analytics/team" element={<TeamStats />} />
        <Route path="analytics/players" element={<PlayerExplorer />} />
        <Route path="analytics/categories" element={<CategoryBreakdown />} />

        {/* Admin */}
        <Route
          path="admin/club"
          element={
            <AdminRoute>
              <ClubAdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/scoring"
          element={
            <AdminRoute>
              <ScoringConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/import"
          element={
            <AdminRoute>
              <ImportPage />
            </AdminRoute>
          }
        />
        <Route
          path="admin/play-cricket"
          element={
            <AdminRoute>
              <PlayCricketIntegrationPage />
            </AdminRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
