import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import GuideLayout from './layouts/GuideLayout';
import GrowerLayout from './layouts/GrowerLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Guide Pages
import GuideDashboard from './pages/guide/Dashboard';
import GuidePartners from './pages/guide/Partners';
import GuideTasks from './pages/guide/Tasks';
import GuideCheckins from './pages/guide/Checkins';

// Grower Pages
import GrowerDashboard from './pages/grower/Dashboard';
import GrowerTasks from './pages/grower/Tasks';
import Cottage from './pages/cottage/CottageView';
import Shop from './pages/cottage/Shop';
import Rewards from './pages/grower/Rewards';
import Collections from './pages/cottage/Collections';
import Ranking from './pages/cottage/Ranking';
import AchievementPage from './pages/AchievementPage';
import PreferencesPage from './pages/PreferencesPage';
import RandomChallengePage from './pages/RandomChallengePage';
import RewardShopPage from './pages/RewardShopPage';
import CertificatePage from './pages/CertificatePage';
import TaskCalendarPage from './pages/TaskCalendarPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminContent from './pages/admin/Content';
import AdminShop from './pages/admin/Shop';
import AdminSalesStats from './pages/admin/SalesStats';
import AdminTasks from './pages/admin/Tasks';
import AdminTaskTemplates from './pages/admin/TaskTemplates';

// SSO
import SSOLogin from './pages/SSOLogin';
import TestSSO from './pages/TestSSO';
import SimpleTest from './pages/SimpleTest';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/simple-test" element={<SimpleTest />} />
          <Route path="/sso-login" element={<SSOLogin />} />
          <Route path="/test-sso" element={<TestSSO />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Guide Routes */}
        <Route
          path="/guide/*"
          element={
            <ProtectedRoute allowedRoles={['GUIDE', 'ADMIN']}>
              <GuideLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<GuideDashboard />} />
          <Route path="dashboard" element={<GuideDashboard />} />
          <Route path="partners" element={<GuidePartners />} />
          <Route path="tasks" element={<GuideTasks />} />
          <Route path="checkins" element={<GuideCheckins />} />
        </Route>

        {/* Grower Routes */}
        <Route
          path="/grower/*"
          element={
            <ProtectedRoute allowedRoles={['GROWER', 'ADMIN']}>
              <GrowerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<GrowerDashboard />} />
          <Route path="dashboard" element={<GrowerDashboard />} />
          <Route path="tasks" element={<GrowerTasks />} />
          <Route path="cottage" element={<Cottage />} />
          <Route path="cottage/ranking" element={<Ranking />} />
          <Route path="collections" element={<Collections />} />
          <Route path="shop" element={<Shop />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="achievements" element={<AchievementPage />} />
          <Route path="preferences" element={<PreferencesPage />} />
          <Route path="random-challenge" element={<RandomChallengePage />} />
          <Route path="shop" element={<RewardShopPage />} />
          <Route path="certificate" element={<CertificatePage />} />
          <Route path="calendar" element={<TaskCalendarPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="shop" element={<AdminShop />} />
          <Route path="sales-stats" element={<AdminSalesStats />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="task-templates" element={<AdminTaskTemplates />} />
        </Route>

        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'GUIDE':
      return <Navigate to="/guide/dashboard" replace />;
    case 'GROWER':
      return <Navigate to="/grower/dashboard" replace />;
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
