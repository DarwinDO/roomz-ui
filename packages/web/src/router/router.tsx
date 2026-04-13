import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell.tsx';
import AdminShell from './AdminShell.tsx';
import PageLoader from './PageLoader';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import LegacyServicesRedirect from './LegacyServicesRedirect';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LandlordRoute } from '@/components/LandlordRoute';

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
const SwapMatchesPage = lazy(() => import('@/pages/SwapMatchesPage'));
const SwapRequestsPage = lazy(() => import('@/pages/SwapRequestsPage'));
const MySubletsPage = lazy(() => import('@/pages/MySubletsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const VerificationPage = lazy(() => import('@/pages/VerificationPage'));
const StudentCardVerificationPage = lazy(() => import('@/pages/StudentCardVerificationPage'));
const ServicesHubPage = lazy(() => import('@/pages/ServicesHubPage'));
const RomiPage = lazy(() => import('@/pages/RomiPage'));
const SubletDetailPage = lazy(() => import('@/pages/SubletDetailPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const LandlordDashboardPage = lazy(() => import('@/pages/LandlordDashboardPage'));
const PostRoomPage = lazy(() => import('@/pages/PostRoomPage'));
const PaymentPage = lazy(() => import('@/pages/PaymentPage'));
const BecomeLandlordPage = lazy(() => import('@/pages/BecomeLandlordPage'));
const PostSubletPage = lazy(() => import('@/pages/PostSubletPage'));
const EditSubletPage = lazy(() => import('@/pages/EditSubletPage'));
const SubletApplicationsPage = lazy(() => import('@/pages/SubletApplicationsPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

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
const ServiceLeadsPage = lazy(() => import('@/pages/admin/ServiceLeadsPage'));
const PartnerLeadsPage = lazy(() => import('@/pages/admin/PartnerLeadsPage'));
const IngestionReviewPage = lazy(() => import('@/pages/admin/IngestionReviewPage'));
const DataQualityPage = lazy(() => import('@/pages/admin/DataQualityPage'));
const LocationsPage = lazy(() => import('@/pages/admin/LocationsPage'));
const HostApplicationsPage = lazy(() => import('@/pages/admin/HostApplicationsPage'));


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
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ResetPasswordPage />
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
        path: 'swap-matches',
        element: (
          <ProtectedRoute>
            <SwapMatchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'swap-requests',
        element: (
          <ProtectedRoute>
            <SwapRequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-sublets',
        element: (
          <ProtectedRoute>
            <MySubletsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'create-sublet',
        element: (
          <ProtectedRoute>
            <PostSubletPage />
          </ProtectedRoute>
        ),
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
        element: (
          <ProtectedRoute>
            <VerificationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'verification/student-card',
        element: (
          <ProtectedRoute>
            <StudentCardVerificationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services',
        element: <ServicesHubPage />,
      },
      {
        path: 'romi',
        element: <RomiPage />,
      },
      {
        path: 'local-passport',
        element: <LegacyServicesRedirect tab="deals" />,
      },
      {
        path: 'support-services',
        element: <LegacyServicesRedirect tab="services" />,
      },
      {
        path: 'settings',
        element: <Navigate to="/profile" replace />,
      },
      {
        path: 'sublet/:id',
        element: <SubletDetailPage />,
      },
      {
        path: 'sublet/:id/edit',
        element: (
          <ProtectedRoute>
            <EditSubletPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sublet/:id/applications',
        element: (
          <ProtectedRoute>
            <SubletApplicationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'partners',
        element: <LegacyServicesRedirect tab="deals" />,
      },
      {
        path: 'become-host',
        element: (
          <ProtectedRoute>
            <BecomeLandlordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'become-landlord',
        element: <Navigate to="/become-host" replace />,
      },
      {
        path: 'host',
        element: (
          <LandlordRoute>
            <LandlordDashboardPage />
          </LandlordRoute>
        ),
      },
      {
        path: 'landlord',
        element: <Navigate to="/host" replace />,
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
        path: 'host/bookings/:id',
        element: (
          <LandlordRoute>
            <Navigate to="/host?tab=appointments" replace />
          </LandlordRoute>
        ),
      },
      {
        path: 'landlord/bookings/:id',
        element: <Navigate to="/host?tab=appointments" replace />,
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
      {
        path: 'partner-leads',
        element: <PartnerLeadsPage />,
      },
      {
        path: 'ingestion-review',
        element: <IngestionReviewPage />,
      },
      {
        path: 'locations',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LocationsPage />
          </Suspense>
        ),
      },
      {
        path: 'host-applications',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HostApplicationsPage />
          </Suspense>
        ),
      },
      {
        path: 'data-quality',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DataQualityPage />
          </Suspense>
        ),
      },
      {
        path: 'service-leads',
        element: <ServiceLeadsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);


