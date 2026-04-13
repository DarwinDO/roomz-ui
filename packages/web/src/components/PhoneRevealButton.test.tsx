import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PhoneRevealButton } from "./PhoneRevealButton";
import { getRoomContact } from "@/services/rooms";

const navigateMock = vi.fn();

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/contexts", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/services/rooms", () => ({
  getRoomContact: vi.fn(),
}));

vi.mock("@/services/analyticsTracking", () => ({
  trackFeatureEvent: vi.fn(),
}));

describe("PhoneRevealButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-13T23:59:00.000Z"));
    navigateMock.mockReset();
    vi.mocked(getRoomContact).mockReset();
  });

  test.afterEach(() => {
    vi.useRealTimers();
  });

  test("clears stale masked state after the UTC day rolls over", async () => {
    vi.mocked(getRoomContact).mockResolvedValue({
      phone: "091***123",
      isMasked: true,
    });

    render(<PhoneRevealButton roomId="room-1" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /xem số điện thoại/i }));
    });

    expect(screen.getByText("091***123")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /xem số điện thoại/i })).toBeNull();

    await act(async () => {
      vi.setSystemTime(new Date("2026-04-14T00:00:01.000Z"));
      fireEvent(window, new Event("focus"));
    });

    expect(screen.getByRole("button", { name: /xem số điện thoại/i })).toBeInTheDocument();
  });
});
