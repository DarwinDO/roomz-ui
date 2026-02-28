/**
 * Landlord Route Protection
 * Blocks non-landlord users from accessing landlord pages
 * Redirects to become-landlord page if user is not a landlord
 */

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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Not logged in → redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user is landlord
    const isLandlord = profile?.role === 'landlord';

    // Not landlord → redirect to become-landlord page
    if (!isLandlord) {
        return <Navigate to="/become-landlord" replace />;
    }

    return <>{children}</>;
}
