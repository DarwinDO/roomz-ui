/**
 * RoommatesPage - Main page for Roommate Finder
 * Routes to Setup Wizard or Results based on profile state
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoommateProfile, useRoommateSetup } from '@/hooks/useRoommates';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Import step components
import { LocationStep } from './components/setup/LocationStep';
import { QuizStep } from './components/setup/QuizStep';
import { ProfileStep } from './components/setup/ProfileStep';
import { RoommateResults } from './components/results/RoommateResults';

export default function RoommatesPage() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { loading: profileLoading, hasProfile } = useRoommateProfile();
    const {
        state,
        setLocationData,
        setQuizAnswers,
        setProfileData,
        goToStep,
        completeSetup,
    } = useRoommateSetup();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { state: { from: '/roommates' } });
        }
    }, [authLoading, user, navigate]);

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
        // PRIORITY: If user already has profile, always show results
        // This prevents flash of wizard while useEffect updates step to 'complete'
        if (hasProfile) {
            return <RoommateResults />;
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
                            await completeSetup();
                        }}
                        onBack={() => goToStep('quiz')}
                    />
                );

            case 'complete':
                return <RoommateResults />;

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
