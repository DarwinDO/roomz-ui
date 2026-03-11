import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageLoader from './PageLoader';

export default function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  const isAdmin = user && profile?.role === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
}
