/**
 * Services Index - Web Package
 * 
 * This file re-exports all services from @roomz/shared
 * and provides web-specific adapters.
 * 
 * For the web platform, SupabaseClient is automatically injected
 * from the web package's supabase instance.
 * 
 * For storage (localStorage), we use the web's storage adapter.
 */

import { supabase } from '@/lib/supabase';
import { getStorageAdapter } from '@/adapters';

// Re-export ALL shared services
// The shared services accept SupabaseClient as first parameter
// We're binding them to the web supabase instance

// Room services
import * as roomsShared from '@roomz/shared/services/rooms';
export const searchRooms = (filters?: roomsShared.RoomFilters) => roomsShared.searchRooms(supabase, filters);
export const getRoomById = (id: string) => roomsShared.getRoomById(supabase, id);
export const createRoom = (data: roomsShared.CreateRoomData) => roomsShared.createRoom(supabase, data);
export const updateRoom = (id: string, roomData: Partial<roomsShared.Room>, amenities?: Partial<roomsShared.RoomAmenity>) => roomsShared.updateRoom(supabase, id, roomData, amenities);
export const updateRoomWithData = (id: string, data: roomsShared.UpdateRoomData) => roomsShared.updateRoomWithData(supabase, id, data);
export const deleteRoom = (id: string) => roomsShared.deleteRoom(supabase, id);
export const getRoomsByLandlord = (landlordId: string) => roomsShared.getRoomsByLandlord(supabase, landlordId);
export const getRoomContact = (roomId: string) => roomsShared.getRoomContact(supabase, roomId);
export type { Room, RoomImage, RoomAmenity, RoomWithDetails, RoomFilters, RoomSearchResponse, CreateRoomData, UpdateRoomData, RoomContactResult, SortOption } from '@roomz/shared/services/rooms';

// Messages service
import * as messagesShared from '@roomz/shared/services/messages';
export const getConversations = (userId: string) => messagesShared.getConversations(supabase, userId);
export const getConversationMessages = (conversationId: string) => messagesShared.getConversationMessages(supabase, conversationId);
export const getUnreadCount = (userId: string) => messagesShared.getUnreadCount(supabase, userId);
export const sendMessage = (conversationId: string, senderId: string, content: string) => messagesShared.sendMessage(supabase, conversationId, senderId, content);
export const markMessagesAsRead = (conversationId: string, userId: string) => messagesShared.markMessagesAsRead(supabase, conversationId, userId);
export const getOrCreateConversation = (userId: string, otherUserId: string) => messagesShared.getOrCreateConversation(supabase, userId, otherUserId);
export type { Message, MessageWithUsers, Conversation } from '@roomz/shared/services/messages';

// Community service
import * as communityShared from '@roomz/shared/services/community';
export const getPosts = (filters?: communityShared.CommunityFilters) => communityShared.getPosts(supabase, filters);
export const getPostById = (id: string) => communityShared.getPostById(supabase, id);
export const createPost = (data: { type: 'discussion' | 'question' | 'review' | 'advice' | 'news'; title: string; content: string; category: string; tags?: string[]; images?: string[] }) => communityShared.createPost(supabase, data);
export const updatePost = (id: string, data: Partial<{ title: string; content: string; category: string; tags: string[]; images: string[]; status: 'draft' | 'published' | 'hidden' | 'deleted' }>) => communityShared.updatePost(supabase, id, data);
export const deletePost = (id: string) => communityShared.deletePost(supabase, id);
export const getComments = (postId: string) => communityShared.getComments(supabase, postId);
export const addComment = (postId: string, userId: string, content: string, parentId?: string) => communityShared.addComment(supabase, postId, userId, content, parentId);
export type { CommunityPost, CommunityComment, CommunityFilters } from '@roomz/shared/services/community';

// Favorites
import * as favoritesShared from '@roomz/shared/services/favorites';
export const getFavorites = (userId: string, itemType?: 'room' | 'sublet' | 'post') => favoritesShared.getFavorites(supabase, userId, itemType);
export const addFavorite = (userId: string, itemId: string, itemType: 'room' | 'sublet' | 'post') => favoritesShared.addFavorite(supabase, userId, itemId, itemType);
export const removeFavorite = (userId: string, itemId: string) => favoritesShared.removeFavorite(supabase, userId, itemId);
export const isFavorited = (userId: string, itemId: string) => favoritesShared.isFavorited(supabase, userId, itemId);
export const getFavoriteRooms = (userId: string) => favoritesShared.getFavoriteRooms(supabase, userId);
export type { Favorite } from '@roomz/shared/services/favorites';

// Bookings
import * as bookingsShared from '@roomz/shared/services/bookings';
export const getUserBookings = (userId: string) => bookingsShared.getUserBookings(supabase, userId);
export const getRoomBookings = (roomId: string) => bookingsShared.getRoomBookings(supabase, roomId);
export const createBooking = (data: { user_id: string; room_id: string; type: 'viewing' | 'moving' | 'deposit'; scheduled_date: string; scheduled_time: string; notes?: string; contact_phone?: string }) => bookingsShared.createBooking(supabase, data);
export const updateBooking = (id: string, data: Partial<{ scheduled_date: string; scheduled_time: string; status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; notes: string }>) => bookingsShared.updateBooking(supabase, id, data);
export const cancelBooking = (id: string) => bookingsShared.cancelBooking(supabase, id);
export const confirmBooking = (id: string) => bookingsShared.confirmBooking(supabase, id);
export type { Booking, BookingStatus, BookingType } from '@roomz/shared/services/bookings';

// Deals
import * as dealsShared from '@roomz/shared/services/deals';
export const getActiveDeals = () => dealsShared.getActiveDeals(supabase);
export const getDealById = (id: string) => dealsShared.getDealById(supabase, id);
export const validateDealCode = (code: string, bookingAmount?: number) => dealsShared.validateDealCode(supabase, code, bookingAmount);
export const getPartnerDeals = (partnerId: string) => dealsShared.getPartnerDeals(supabase, partnerId);
export type { Deal, DealStatus } from '@roomz/shared/services/deals';

// Partners
import * as partnersShared from '@roomz/shared/services/partners';
export const getPartners = (options?: { category?: 'moving' | 'cleaning' | 'real_estate' | 'utilities' | 'furniture' | 'other'; city?: string; search?: string }) => partnersShared.getPartners(supabase, options);
export const getPartnerById = (id: string) => partnersShared.getPartnerById(supabase, id);
export const getPartnersByCategory = (category: 'moving' | 'cleaning' | 'real_estate' | 'utilities' | 'furniture' | 'other') => partnersShared.getPartnersByCategory(supabase, category);
export const getPartnerCategories = () => partnersShared.getPartnerCategories(supabase);
export const searchPartners = (query: string, category?: 'moving' | 'cleaning' | 'real_estate' | 'utilities' | 'furniture' | 'other') => partnersShared.searchPartners(supabase, query, category);
export type { Partner, PartnerStatus, PartnerCategory } from '@roomz/shared/services/partners';

// Reviews
import * as reviewsShared from '@roomz/shared/services/reviews';
export const getPartnerReviews = (partnerId: string) => reviewsShared.getPartnerReviews(supabase, partnerId);
export const getPartnerReviewStats = (partnerId: string) => reviewsShared.getPartnerReviewStats(supabase, partnerId);
export const createReview = (data: { partner_id: string; user_id: string; rating: number; comment?: string; images?: string[] }) => reviewsShared.createReview(supabase, data);
export const updateReview = (id: string, data: { rating?: number; comment?: string; images?: string[] }) => reviewsShared.updateReview(supabase, id, data);
export const deleteReview = (id: string) => reviewsShared.deleteReview(supabase, id);
export type { Review } from '@roomz/shared/services/reviews';

// Profile
import * as profileShared from '@roomz/shared/services/profile';
export const getProfile = (userId: string) => profileShared.getProfile(supabase, userId);
export const updateProfile = (userId: string, data: Partial<{ full_name: string; phone: string; avatar_url: string; gender: 'male' | 'female' | 'other'; date_of_birth: string; city: string; district: string; address: string; bio: string; university: string; major: string; occupation: string }>) => profileShared.updateProfile(supabase, userId, data);
export const updateAvatar = (userId: string, avatarUrl: string) => profileShared.updateAvatar(supabase, userId, avatarUrl);
export const getUsersByIds = (userIds: string[]) => profileShared.getUsersByIds(supabase, userIds);
export const searchUsers = (query: string) => profileShared.searchUsers(supabase, query);
export type { UserProfile } from '@roomz/shared/services/profile';

// Reports
import * as reportsShared from '@roomz/shared/services/reports';
export const createReport = (data: { reporter_id: string; type: 'room' | 'user' | 'message' | 'review' | 'post' | 'partner'; target_id: string; reason: string; description?: string; evidence?: string[] }) => reportsShared.createReport(supabase, data);
export const getUserReports = (userId: string) => reportsShared.getUserReports(supabase, userId);
export const getReportById = (id: string) => reportsShared.getReportById(supabase, id);
export const getAllReports = (options?: { status?: 'pending' | 'reviewed' | 'resolved' | 'rejected'; type?: 'room' | 'user' | 'message' | 'review' | 'post' | 'partner'; page?: number; pageSize?: number }) => reportsShared.getAllReports(supabase, options);
export const updateReportStatus = (id: string, data: { status: 'pending' | 'reviewed' | 'resolved' | 'rejected'; admin_notes?: string }) => reportsShared.updateReportStatus(supabase, id, data);
export type { Report, ReportType, ReportStatus } from '@roomz/shared/services/reports';

// Service Leads
import * as serviceLeadsShared from '@roomz/shared/services/serviceLeads';
export const getUserServiceLeads = (userId: string) => serviceLeadsShared.getUserServiceLeads(supabase, userId);
export const getServiceLeadById = (id: string) => serviceLeadsShared.getServiceLeadById(supabase, id);
export const createServiceLead = (userId: string, data: { service_type: 'moving' | 'cleaning' | 'setup' | 'support'; partner_id?: string; details: Record<string, unknown>; preferred_date?: string }) => serviceLeadsShared.createServiceLead(supabase, userId, data);
export const updateServiceLead = (id: string, data: { status?: 'submitted' | 'assigned' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'rated'; partner_id?: string; estimated_price?: number; user_rating?: number; user_review?: string }) => serviceLeadsShared.updateServiceLead(supabase, id, data);
export const cancelServiceLead = (id: string) => serviceLeadsShared.cancelServiceLead(supabase, id);
export const getAllServiceLeads = (filters?: { status?: 'submitted' | 'assigned' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'rated'; service_type?: 'moving' | 'cleaning' | 'setup' | 'support' }) => serviceLeadsShared.getAllServiceLeads(supabase, filters);

// Sublets
import * as subletsShared from '@roomz/shared/services/sublets';
import type { SubletFilters } from '@roomz/shared/types/swap';
export const searchSublets = (filters?: SubletFilters) => subletsShared.searchSublets(supabase, filters);
export const getSubletById = (id: string) => subletsShared.getSubletById(supabase, id);
export const getUserSublets = (userId: string) => subletsShared.getUserSublets(supabase, userId);
export const createSublet = (userId: string, data: { original_room_id: string; start_date: string; end_date: string; sublet_price: number; deposit_required?: number; description?: string; requirements?: string[] }) => subletsShared.createSublet(supabase, userId, data);
export const updateSublet = (id: string, data: Partial<{ start_date: string; end_date: string; sublet_price: number; deposit_required: number; description: string; requirements: string[]; status: 'active' | 'booked' | 'cancelled' }>) => subletsShared.updateSublet(supabase, id, data);
export const deleteSublet = (id: string) => subletsShared.deleteSublet(supabase, id);
export type { SubletListing, SubletFilters, SubletSearchResponse, SubletListingWithDetails, SubletApplication, CreateSubletRequest } from '@roomz/shared/types/swap';

// Swap
import * as swapShared from '@roomz/shared/services/swap';
export const getUserSwapRequests = (userId: string) => swapShared.getUserSwapRequests(supabase, userId);
export const createSwapRequest = (userId: string, data: { requester_listing_id: string; recipient_listing_id: string; message?: string; proposed_start_date: string; proposed_end_date: string }) => swapShared.createSwapRequest(supabase, userId, data);
export const respondToSwapRequest = (requestId: string, userId: string, data: { status: 'accepted' | 'rejected'; rejection_reason?: string }) => swapShared.respondToSwapRequest(supabase, requestId, userId, data);
export const cancelSwapRequest = (requestId: string, userId: string) => swapShared.cancelSwapRequest(supabase, requestId, userId);
export const getPotentialMatches = (listingId: string) => swapShared.getPotentialMatches(supabase, listingId);
export type { SwapRequest, CreateSwapRequest, RespondToSwapRequest, PotentialMatch, PotentialMatchResponse } from '@roomz/shared/types/swap';

// Analytics
import * as analyticsShared from '@roomz/shared/services/analytics';
import type { AnalyticsEventName } from '@roomz/shared/services/analytics';
export const trackEvent = (event: { event_name: AnalyticsEventName; user_id: string | null; session_id: string | null; properties: Record<string, unknown> }) => analyticsShared.trackEvent(supabase, event);
export const trackPageView = (userId: string | null, sessionId: string | null, pageName: string, properties?: Record<string, unknown>) => analyticsShared.trackPageView(supabase, userId, sessionId, pageName, properties);
export const trackRoomView = (userId: string | null, sessionId: string | null, roomId: string, roomTitle: string, price: number) => analyticsShared.trackRoomView(supabase, userId, sessionId, roomId, roomTitle, price);
export const trackSearch = (userId: string | null, sessionId: string | null, query: string, filters: Record<string, unknown>, resultCount: number) => analyticsShared.trackSearch(supabase, userId, sessionId, query, filters, resultCount);
export const trackBooking = (userId: string | null, sessionId: string | null, bookingId: string, bookingType: 'viewing' | 'moving' | 'deposit', roomId: string, price: number) => analyticsShared.trackBooking(supabase, userId, sessionId, bookingId, bookingType, roomId, price);
export const trackSubscription = (userId: string, eventType: 'subscription_started' | 'subscription_renewed' | 'subscription_cancelled', planId: string, amount: number) => analyticsShared.trackSubscription(supabase, userId, eventType, planId, amount);

// Roommates (with storage adapter)
import * as roommatesShared from '@roomz/shared/services/roommates';
export const getRoommateProfile = (userId: string) => roommatesShared.getRoommateProfile(supabase, userId);
export const createRoommateProfile = (userId: string, data: roommatesShared.RoommateProfileInput) => roommatesShared.createRoommateProfile(supabase, userId, data);
export const updateRoommateProfile = (userId: string, data: Partial<roommatesShared.RoommateProfileInput>) => roommatesShared.updateRoommateProfile(supabase, userId, data);
export const updateProfileStatus = (userId: string, status: roommatesShared.RoommateProfileStatus) => roommatesShared.updateProfileStatus(supabase, userId, status);
export const deleteRoommateProfile = (userId: string) => roommatesShared.deleteRoommateProfile(supabase, userId);
export const saveQuizAnswers = (userId: string, answers: roommatesShared.QuizAnswer[]) => roommatesShared.saveQuizAnswers(supabase, userId, answers);
export const getQuizAnswers = (userId: string) => roommatesShared.getQuizAnswers(supabase, userId);
export const getTopMatches = (userId: string, limit?: number) => roommatesShared.getTopMatches(supabase, userId, limit);
export const calculateCompatibility = (user1Id: string, user2Id: string) => roommatesShared.calculateCompatibility(supabase, user1Id, user2Id);
export const sendRoommateRequest = (senderId: string, receiverId: string, message?: string) => roommatesShared.sendRoommateRequest(supabase, senderId, receiverId, message);
export const getConnectedUsers = (userId: string) => roommatesShared.getConnectedUsers(supabase, userId);
export const cancelRoommateRequest = (requestId: string) => roommatesShared.cancelRoommateRequest(supabase, requestId);
export const respondToRequest = (requestId: string, accept: boolean) => roommatesShared.respondToRequest(supabase, requestId, accept);
export const getReceivedRequests = (userId: string) => roommatesShared.getReceivedRequests(supabase, userId);
export const getSentRequests = (userId: string) => roommatesShared.getSentRequests(supabase, userId);

// Premium limits (storage adapter)
export const getDailyViewCount = (userId?: string) => roommatesShared.getDailyViewCount(getStorageAdapter(), userId);
export const incrementDailyViewCount = (userId: string) => roommatesShared.incrementDailyViewCount(getStorageAdapter(), userId);
export const canViewMoreProfiles = (userId?: string) => roommatesShared.canViewMoreProfiles(getStorageAdapter(), userId);
export const getDailyRequestCount = (userId?: string) => roommatesShared.getDailyRequestCount(getStorageAdapter(), userId);
export const incrementDailyRequestCount = (userId: string) => roommatesShared.incrementDailyRequestCount(getStorageAdapter(), userId);
export const canSendMoreRequests = (userId?: string) => roommatesShared.canSendMoreRequests(getStorageAdapter(), userId);
export const getRemainingLimits = (userId?: string) => roommatesShared.getRemainingLimits(getStorageAdapter(), userId);
export type { RoommateProfile, RoommateProfileInput, RoommateMatch, RoommateRequest, RoommateProfileStatus, RoommateRequestStatus, QuizAnswer } from '@roomz/shared/services/roommates';

// Vietnam locations (storage adapter)
import * as vietnamLocations from '@roomz/shared/services/vietnamLocations';
export const getProvinces = () => vietnamLocations.getProvinces(getStorageAdapter());
export const getDistricts = (provinceCode: number, provinceName: string) => vietnamLocations.getDistricts(getStorageAdapter(), provinceCode, provinceName);
export const searchProvinces = vietnamLocations.searchProvinces;
export type { Province, District } from '@roomz/shared/services/vietnamLocations';

// Realtime (from shared)
import * as realtimeShared from '@roomz/shared/services/realtime';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const subscribeToConversationMessages = (conversationId: string, callbacks: any) =>
    realtimeShared.subscribeToConversationMessages(supabase, conversationId, callbacks);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const subscribeToUserMessages = (userId: string, callbacks: any) =>
    realtimeShared.subscribeToUserMessages(supabase, userId, callbacks);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const subscribeToConversations = (userId: string, callbacks: any) =>
    realtimeShared.subscribeToConversations(supabase, userId, callbacks);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createTypingChannel = (conversationId: string, userId: string, userName: string, onTyping: any) =>
    realtimeShared.createTypingChannel(supabase, conversationId, userId, userName, onTyping);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createPresenceChannel = (conversationId: string, userId: string, userName: string, callbacks: any) =>
    realtimeShared.createPresenceChannel(supabase, conversationId, userId, userName, callbacks);
export const onConnectionStatusChange = realtimeShared.onConnectionStatusChange;
export const cleanupAllChannels = () => realtimeShared.cleanupAllChannels(supabase);
export const getActiveChannelCount = () => realtimeShared.getActiveChannelCount(supabase);
export type { RealtimeSubscription, UserPresence, TypingIndicator, ConnectionStatus } from '@roomz/shared/services/realtime';

// Keep web-specific services here
export { supabase } from '@/lib/supabase';

// Admin services (keep in web)
export * from './admin';
export * from './admin-payments';

// Payments (keep in web - depends on sepay)
export * from './payments';
export * from './sepay';

// Image services (keep in web - depend on browser-image-compression)
export * from './roomImages';
export * from './communityImages';
export * from './verification';

// Backward compatibility - re-export from local files that may have different implementations
export * from './roommates';
