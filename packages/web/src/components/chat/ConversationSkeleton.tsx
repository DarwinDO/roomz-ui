/**
 * ConversationSkeleton Component
 * Skeleton loading for conversation list
 */

import { Skeleton } from '@/components/ui/skeleton';

interface ConversationSkeletonProps {
    count?: number;
}

export function ConversationSkeleton({ count = 5 }: ConversationSkeletonProps) {
    return (
        <div className="divide-y divide-border">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-4 flex items-start gap-3">
                    {/* Avatar skeleton */}
                    <Skeleton className="w-12 h-12 rounded-full" />

                    <div className="flex-1 space-y-2">
                        {/* Name and time */}
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-12" />
                        </div>

                        {/* Last message */}
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * MessageSkeleton Component
 * Skeleton loading for message list
 */
export function MessageSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: count }).map((_, i) => {
                const isRight = i % 3 === 0; // Alternate sides
                return (
                    <div
                        key={i}
                        className={`flex gap-2 ${isRight ? 'justify-end' : 'justify-start'}`}
                    >
                        {!isRight && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
                        <div className={`space-y-1 ${isRight ? 'items-end' : 'items-start'}`}>
                            <Skeleton
                                className={`h-16 rounded-2xl ${isRight ? 'w-48' : 'w-56'}`}
                            />
                            <Skeleton className="h-2 w-16" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
