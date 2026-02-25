/**
 * Room utility functions
 */
import type { RoomWithDetails } from "@/services/rooms";

/**
 * Transform room data to RoomCard props
 * Unified function used by ProfilePage and SearchPage
 */
export function transformRoomToCardProps(
    room: RoomWithDetails,
    isFavorited: boolean = false
) {
    // Get primary image or first image
    const primaryImage = room.images?.find((img) => img.is_primary) || room.images?.[0];
    const imageUrl = primaryImage?.image_url || '';

    // Format location
    const location = [room.district, room.city].filter(Boolean).join(', ') || room.address;

    return {
        id: room.id,
        image: imageUrl,
        title: room.title,
        location,
        price: Number(room.price_per_month),
        distance: undefined,
        verified: room.is_verified || false,
        available: room.is_available || false,
        matchPercentage: undefined,
        isFavorited,
    };
}
