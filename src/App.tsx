import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/theme-context';
import { StorageProvider } from './contexts/storage-context';
import { AuthProvider } from './contexts/auth-context';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PlayerProfilePage from './pages/PlayerProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ScorecardAnalysisPage from './pages/ScorecardAnalysisPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <StorageProvider>
          <AuthProvider>
            <BrowserRouter>
              <Helmet>
                <title>Brookweald Cricket Club</title>
                <meta name="description" content="Brookweald Cricket Club - MVP Leaderboard" />
              </Helmet>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="player/:playerId" element={<PlayerProfilePage />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="scorecard-analysis" element={<ScorecardAnalysisPage />} />
                </Route>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </StorageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;