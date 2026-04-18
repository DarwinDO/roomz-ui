import { describe, expect, test } from "vitest";
import { shouldTrackPublicRoomView } from "./roomViewTracking";

describe("shouldTrackPublicRoomView", () => {
  test("allows public active-room views once auth is resolved", () => {
    expect(
      shouldTrackPublicRoomView({
        authLoading: false,
        roomStatus: "active",
        roomLandlordId: "landlord-1",
        viewerId: null,
        viewerRole: null,
        hasProfile: false,
      }),
    ).toBe(true);
  });

  test("blocks tracking while auth is still loading", () => {
    expect(
      shouldTrackPublicRoomView({
        authLoading: true,
        roomStatus: "active",
        roomLandlordId: "landlord-1",
        viewerId: null,
        viewerRole: null,
        hasProfile: false,
      }),
    ).toBe(false);
  });

  test("blocks tracking for authenticated viewers before profile is ready", () => {
    expect(
      shouldTrackPublicRoomView({
        authLoading: false,
        roomStatus: "active",
        roomLandlordId: "landlord-1",
        viewerId: "user-1",
        viewerRole: null,
        hasProfile: false,
      }),
    ).toBe(false);
  });

  test("blocks tracking for pending room previews", () => {
    expect(
      shouldTrackPublicRoomView({
        authLoading: false,
        roomStatus: "pending",
        roomLandlordId: "landlord-1",
        viewerId: null,
        viewerRole: null,
        hasProfile: false,
      }),
    ).toBe(false);
  });

  test("blocks tracking for admin previews", () => {
    expect(
      shouldTrackPublicRoomView({
        authLoading: false,
        roomStatus: "active",
        roomLandlordId: "landlord-1",
        viewerId: "admin-1",
        viewerRole: "admin",
        hasProfile: true,
      }),
    ).toBe(false);
  });

  test("blocks tracking for landlord self-previews", () => {
    expect(
      shouldTrackPublicRoomView({
        authLoading: false,
        roomStatus: "active",
        roomLandlordId: "landlord-1",
        viewerId: "landlord-1",
        viewerRole: "landlord",
        hasProfile: true,
      }),
    ).toBe(false);
  });
});
