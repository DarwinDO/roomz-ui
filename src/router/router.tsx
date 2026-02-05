import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell.tsx';
import AdminShell from './AdminShell.tsx';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LandlordRoute } from '@/components/LandlordRoute';
import { useAuth } from '@/contexts/AuthContext';

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-white to-secondary/10">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-gray-600">Đang tải...</p>
    </div>
  </div>
);

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const RoomDetailPage = lazy(() => import('@/pages/RoomDetailPage'));
const RoommateLayout = lazy(() => import('@/pages/roommates').then(m => ({ default: m.RoommateLayout })));
const RoommateResultsPage = lazy(() => import('@/pages/roommates').then(m => ({ default: m.RoommateResults })));
const RoommateRequestsPage = lazy(() => import('@/pages/roommates').then(m => ({ default: m.RequestsList })));
const MyRoommateProfilePage = lazy(() => import('@/pages/roommates').then(m => ({ default: m.MyRoommateProfile })));
const EditRoommateProfilePage = lazy(() => import('@/pages/roommates').then(m => ({ default: m.EditRoommateProfile })));
const RoommateSetupPage = lazy(() => import('@/pages/roommates'));
const SwapRoomPage = lazy(() => import('@/pages/SwapRoomPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const VerificationPage = lazy(() => import('@/pages/VerificationPage'));
const SupportServicesPage = lazy(() => import('@/pages/SupportServicesPage'));
const LocalPassportPage = lazy(() => import('@/pages/LocalPassportPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SubletDetailPage = lazy(() => import('@/pages/SubletDetailPage'));
const PartnersListPage = lazy(() => import('@/pages/PartnersListPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const LandlordDashboardPage = lazy(() => import('@/pages/LandlordDashboardPage'));
const PostRoomPage = lazy(() => import('@/pages/PostRoomPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const BecomeLandlordPage = lazy(() => import('@/pages/BecomeLandlordPage'));

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



// Admin route protection - Uses Supabase auth
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  // Show loader while checking auth
  if (loading) {
    return <PageLoader />;
  }

  // Check if authenticated AND is admin
  const isAdmin = user && profile?.role === 'admin';
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <Suspense fallback={<PageLoader />}>
        <VerifyEmailPage />
      </Suspense>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthCallbackPage />
      </Suspense>
    ),
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
      // Roommate routes with shared layout
      {
        path: 'roommates',
        element: (
          <ProtectedRoute>
            <RoommateLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <RoommateResultsPage />,
          },
          {
            path: 'requests',
            element: <RoommateRequestsPage />,
          },
          {
            path: 'profile',
            element: <MyRoommateProfilePage />,
          },
          {
            path: 'edit',
            element: <EditRoommateProfilePage />,
          },
        ],
      },
      // Setup wizard - separate route without layout (for new users)
      {
        path: 'roommates/setup',
        element: (
          <ProtectedRoute>
            <RoommateSetupPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'swap',
        element: <SwapRoomPage />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages/:conversationId?',
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
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
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sublet/:id',
        element: <SubletDetailPage />,
      },
      {
        path: 'partners',
        element: <PartnersListPage />,
      },
      {
        path: 'become-landlord',
        element: (
          <ProtectedRoute>
            <BecomeLandlordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'landlord',
        element: (
          <LandlordRoute>
            <LandlordDashboardPage />
          </LandlordRoute>
        ),
      },
      {
        path: 'post-room',
        element: (
          <LandlordRoute>
            <PostRoomPage />
          </LandlordRoute>
        ),
      },
      {
        path: 'payment',
        element: (
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        ),
      },
      // Booking detail routes - redirect to proper dashboard
      {
        path: 'landlord/bookings/:id',
        element: (
          <LandlordRoute>
            <Navigate to="/landlord?tab=bookings" replace />
          </LandlordRoute>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <ProtectedRoute>
            <Navigate to="/profile?tab=bookings" replace />
          </ProtectedRoute>
        ),
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

