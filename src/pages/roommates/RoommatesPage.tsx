/**
 * RoommatesPage - Main page for Roommate Finder
 * Routes to Setup Wizard or Results based on profile state
 * 
 * Uses TanStack Query for proper cache management and state sync
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoommateProfileQuery, useRoommateSetupQuery } from '@/hooks/useRoommatesQuery';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Import step components
import { LocationStep } from './components/setup/LocationStep';
import { QuizStep } from './components/setup/QuizStep';
import { ProfileStep } from './components/setup/ProfileStep';

export default function RoommatesPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { loading: profileLoading, hasProfile } = useRoommateProfileQuery();
    const {
        state,
        setLocationData,
        setQuizAnswers,
        setProfileData,
        goToStep,
        completeSetup,
    } = useRoommateSetupQuery();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { state: { from: '/roommates' } });
        }
    }, [authLoading, user, navigate]);

    // Redirect to /roommates with layout after profile is created
    // TanStack Query ensures cache is invalidated, so navigate() works correctly now
    useEffect(() => {
        if (!profileLoading && hasProfile) {
            navigate('/roommates', { replace: true });
        }
    }, [profileLoading, hasProfile, navigate]);

    // Loading state
    if (authLoading || profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return null;
    }

    // Render based on current step
    const renderStep = () => {
        // PRIORITY: If user already has profile, redirect to main roommates page
        // The useEffect above handles this, but we show loading while redirecting
        if (hasProfile) {
            return (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            );
        }

        // No profile yet - show wizard based on current step
        switch (state.step) {
            case 'location':
                return (
                    <LocationStep
                        onNext={setLocationData}
                        onBack={() => navigate(-1)}
                    />
                );

            case 'quiz':
                return (
                    <QuizStep
                        onNext={setQuizAnswers}
                        onBack={() => goToStep('location')}
                    />
                );

            case 'profile':
                return (
                    <ProfileStep
                        onSubmit={async (data) => {
                            setProfileData(data);
                            const success = await completeSetup();
                            if (success) {
                                // TanStack Query invalidates cache -> navigate works!
                                navigate('/roommates', { replace: true });
                            }
                        }}
                        onBack={() => goToStep('quiz')}
                    />
                );

            case 'complete':
                // Navigate to /roommates for proper layout with navbar
                navigate('/roommates', { replace: true });
                return (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                );

            default:
                return <LocationStep onNext={setLocationData} onBack={() => navigate(-1)} />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {renderStep()}
        </div>
    );
}

