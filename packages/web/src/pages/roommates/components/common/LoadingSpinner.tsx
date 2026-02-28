/**
 * LoadingSpinner - Unified loading component for roommate pages
 * Provides consistent loading UX across all roommate tabs
 */

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
    message,
    className = '',
    size = 'md'
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
            <Loader2
                className={`${sizeClasses[size]} animate-spin text-primary`}
            />
            {message && (
                <p className="text-sm text-muted-foreground mt-3">
                    {message}
                </p>
            )}
        </div>
    );
}

/**
 * PageLoading - Full page loading state
 * Used when entire page content is loading
 */
export function PageLoading({ message }: { message?: string }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <LoadingSpinner message={message} size="md" />
        </div>
    );
}
