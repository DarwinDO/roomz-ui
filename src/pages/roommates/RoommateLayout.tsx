/**
 * RoommateLayout - Shared layout for all roommate pages
 * Contains persistent navigation that doesn't reload on tab change
 * Redirects to setup wizard if user doesn't have a profile yet
 */

import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { RoommateNav } from './components/common/RoommateNav';
import { useRoommateProfile } from '@/hooks/useRoommates';

export function RoommateLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loading, hasProfile } = useRoommateProfile();

    // Redirect to setup if no profile exists
    useEffect(() => {
        if (!loading && !hasProfile) {
            navigate('/roommates/setup', { replace: true });
        }
    }, [loading, hasProfile, navigate]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // No profile - will redirect
    if (!hasProfile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Persistent Navigation - Always centered, never reloads */}
                <div className="flex items-center justify-center mb-6">
                    <RoommateNav />
                </div>

                {/* Animated Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
