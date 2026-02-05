/**
 * RoommateCardSkeleton - Loading placeholder for RoommateCard
 * Matches exact height to prevent layout shift (CLS)
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RoommateCardSkeleton() {
    return (
        <Card className="p-4">
            {/* Main Content Row - matches RoommateCard structure */}
            <div className="flex gap-4">
                {/* Avatar Skeleton */}
                <div className="relative flex-shrink-0">
                    <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
                    {/* Score Badge Skeleton */}
                    <Skeleton className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full" />
                </div>

                {/* Info Skeleton */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Name */}
                    <Skeleton className="h-5 sm:h-6 w-32" />
                    {/* Location */}
                    <Skeleton className="h-4 w-40" />
                    {/* Badges */}
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    {/* Score breakdown - hidden on mobile */}
                    <div className="hidden sm:flex gap-2 mt-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-12" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 border-t">
                <Skeleton className="h-9 sm:h-8 w-16" />
                <Skeleton className="h-9 sm:h-8 flex-1" />
            </div>
        </Card>
    );
}

export function RoommateResultsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <RoommateCardSkeleton key={i} />
            ))}
        </div>
    );
}
