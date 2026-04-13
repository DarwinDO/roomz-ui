import { describe, expect, test } from "vitest";
import {
  calculateCleaningEstimate,
  calculateFinalPrice,
  calculateMovingEstimate,
  calculateStudentDiscount,
} from "./serviceBookingPricing";

describe("service booking pricing", () => {
  test("calculates moving estimate from items and access constraints", () => {
    const estimate = calculateMovingEstimate({
      floorPickup: 4,
      floorDestination: 2,
      hasElevatorPickup: false,
      hasElevatorDestination: true,
      items: ["wardrobe", "desk", "boxes"],
    });

    expect(estimate).toBe(991_000);
  });

  test("calculates cleaning estimate from room, bathroom, and add-on counts", () => {
    const estimate = calculateCleaningEstimate({
      cleaningType: "move_in",
      numRooms: 3,
      numBathrooms: 2,
      addOns: ["aircon", "trash"],
    });

    expect(estimate).toBe(1_640_000);
  });

  test("only applies the student discount for verified users", () => {
    expect(calculateStudentDiscount(1_000_000, false)).toBe(0);
    expect(calculateStudentDiscount(1_000_000, true)).toBe(150_000);
    expect(calculateFinalPrice(1_000_000, true)).toBe(850_000);
  });
});
