import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './AppShell.tsx';

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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

