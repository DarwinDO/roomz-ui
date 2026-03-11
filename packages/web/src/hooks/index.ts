/**
 * Web Hooks Index
 * 
 * This file maintains backward compatibility by re-exporting hooks from
 * the web package. For new code, consider using shared hooks from
 * '@roomz/shared/hooks' with proper adapter injection.
 */

// Re-export all original web hooks for backward compatibility

// Profile
export { useUpdateProfile } from './useProfile';

// Rooms
export { useSearchRooms, useRoom, useLandlordRooms, useInvalidateRooms, roomKeys } from './useRooms';

// Messages
export { useConversations, useConversationMessages, useProfileMessages } from './useMessages';
export type { Conversation, MessageWithSender } from './useMessages';

// Realtime Chat
export { useRealtimeChat } from './useRealtimeChat';

// Community
export { usePosts as useCommunity } from './useCommunity';

// Bookings
export { useBooking } from './useBookings';

// Deals
export { useDeals } from './useDeals';

// Partners
export { usePartners } from './usePartners';
export { useLocationCatalogSearch, useNearbyLocations, useFeaturedLocations, locationKeys } from './useLocations';

// Notifications
export { useNotifications } from './useNotifications';

// Premium Limits
export { usePremiumLimits } from './usePremiumLimits';

// Sublets
export { useSublets, useSublet, useMySublets, useCreateSublet, useUpdateSublet, useDeleteSublet, useCreateApplication, useUpdateApplicationStatus, useWithdrawApplication, useInvalidateSublets, subletKeys } from './useSublets';

// Swap
export { useSwapMatches, useSwapRequests, useSwapRequest, useCreateSwapRequest, useRespondToSwapRequest, useCancelSwapRequest, useInvalidateSwap, swapKeys } from './useSwap';

// Favorites
export { useFavorites, useIsFavorited } from './useFavorites';

// Service Leads
export { useMyServiceLeads, useServiceLead, useCreateServiceLead, useCancelServiceLead, useRateServiceLead, serviceLeadKeys } from './useServiceLeads';

// Verification
export { useMyVerificationStatus, useSubmitVerification, usePendingVerifications, useReviewVerification } from './useVerification';

// Roommates
export {
    useRoommateProfileQuery,
    useRoommateQuizQuery,
    useRoommateLimits,
    useRoommateMatchesQuery,
    useRoommateRequestsQuery,
    useRoommateSetupQuery,
    useInvalidateRoommateData,
    roommateKeys
} from './useRoommatesQuery';

// Browser-specific hooks (keep in web)
export { useDebounce } from './useDebounce';
export { useGeolocation } from './useGeolocation';
export { useActivityTracker } from './useActivityTracker';
export { useConfirm } from './useConfirm';
export { usePostSubletForm } from './usePostSubletForm';

// Admin hooks
export { useAdminStats } from './useAdmin';
export { useAdminRealtimeSync } from './useAdminRealtimeSync';
export { useAdminReports } from './useAdminReports';
export { useAdminServiceLeads } from './useAdminServiceLeads';

// Chat hooks (in subdirectory)
export { useConversations as useChatConversations } from './chat/useConversations';
export { useMessages as useChatMessages } from './chat/useMessages';
export { useTypingIndicator } from './chat/useTypingIndicator';
