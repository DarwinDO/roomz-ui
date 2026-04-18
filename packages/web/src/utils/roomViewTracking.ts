type RoomViewTrackingInput = {
  authLoading: boolean;
  roomStatus?: string | null;
  roomLandlordId?: string | null;
  viewerId?: string | null;
  viewerRole?: string | null;
  hasProfile: boolean;
};

export function shouldTrackPublicRoomView({
  authLoading,
  roomStatus,
  roomLandlordId,
  viewerId,
  viewerRole,
  hasProfile,
}: RoomViewTrackingInput) {
  if (authLoading) {
    return false;
  }

  if (viewerId && !hasProfile) {
    return false;
  }

  if (roomStatus !== "active") {
    return false;
  }

  if (viewerRole === "admin") {
    return false;
  }

  if (viewerId && roomLandlordId && viewerId === roomLandlordId) {
    return false;
  }

  return true;
}
