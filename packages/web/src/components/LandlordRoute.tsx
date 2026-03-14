import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface LandlordRouteProps {
  children: React.ReactNode;
}

export function LandlordRoute({ children }: LandlordRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.role !== 'landlord') {
    return <Navigate to="/become-host" replace />;
  }

  return <>{children}</>;
}
