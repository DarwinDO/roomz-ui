import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell.tsx';
import AdminShell from './AdminShell.tsx';

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const RoomDetailPage = lazy(() => import('@/pages/RoomDetailPage'));
const CompatibilityPage = lazy(() => import('@/pages/CompatibilityPage'));
const SwapRoomPage = lazy(() => import('@/pages/SwapRoomPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const VerificationPage = lazy(() => import('@/pages/VerificationPage'));
const SupportServicesPage = lazy(() => import('@/pages/SupportServicesPage'));
const LocalPassportPage = lazy(() => import('@/pages/LocalPassportPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SubletDetailPage = lazy(() => import('@/pages/SubletDetailPage'));
const PartnersListPage = lazy(() => import('@/pages/PartnersListPage'));

// Admin pages
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const RoomsPage = lazy(() => import('@/pages/admin/RoomsPage'));
const VerificationsPage = lazy(() => import('@/pages/admin/VerificationsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const RevenuePage = lazy(() => import('@/pages/admin/RevenuePage'));
const PartnersPage = lazy(() => import('@/pages/admin/PartnersPage'));

// Admin route protection
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'room/:id',
        element: <RoomDetailPage />,
      },
      {
        path: 'roommates',
        element: <CompatibilityPage />,
      },
      {
        path: 'swap',
        element: <SwapRoomPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'community',
        element: <CommunityPage />,
      },
      {
        path: 'verification',
        element: <VerificationPage />,
      },
      {
        path: 'support-services',
        element: <SupportServicesPage />,
      },
      {
        path: 'local-passport',
        element: <LocalPassportPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'sublet/:id',
        element: <SubletDetailPage />,
      },
      {
        path: 'partners',
        element: <PartnersListPage />,
      },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <ProtectedAdminRoute><AdminShell /></ProtectedAdminRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'rooms',
        element: <RoomsPage />,
      },
      {
        path: 'verifications',
        element: <VerificationsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'revenue',
        element: <RevenuePage />,
      },
      {
        path: 'partners',
        element: <PartnersPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

