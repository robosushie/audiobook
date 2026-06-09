import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ROUTES } from "@/constants/routes";
import { AudiobooksPage } from "@/pages/AudiobooksPage";
import { BooksPage } from "@/pages/BooksPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { ReferencePage } from "@/pages/ReferencePage";
import { SimulateAudiobookPage } from "@/pages/simulate/SimulateAudiobookPage";
import { SimulatePage } from "@/pages/simulate/SimulatePage";
import { SimulateVoicePage } from "@/pages/simulate/SimulateVoicePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UsersPage } from "@/pages/UsersPage";

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.users} element={<UsersPage />} />
        <Route path={ROUTES.books} element={<BooksPage />} />
        <Route path={ROUTES.audiobooks} element={<AudiobooksPage />} />
        <Route path={ROUTES.reference} element={<ReferencePage />} />
        <Route path={ROUTES.simulate} element={<SimulatePage />} />
        <Route path={ROUTES.simulateVoice} element={<SimulateVoicePage />} />
        <Route path={ROUTES.simulateAudiobook} element={<SimulateAudiobookPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
