export const STUDENT_DISCOUNT_RATE = 0.15;

export const MOVING_ITEM_OPTIONS = [
  { id: "mattress", label: "Nệm", price: 120_000 },
  { id: "desk", label: "Bàn học", price: 80_000 },
  { id: "chair", label: "Ghế", price: 40_000 },
  { id: "wardrobe", label: "Tủ quần áo", price: 220_000 },
  { id: "boxes", label: "Thùng đồ", price: 100_000 },
  { id: "appliance", label: "Thiết bị điện", price: 180_000 },
] as const;

export const CLEANING_TYPE_OPTIONS = [
  { id: "move_in", label: "Vệ sinh nhận phòng", price: 900_000 },
  { id: "move_out", label: "Vệ sinh trả phòng", price: 1_000_000 },
  { id: "basic", label: "Vệ sinh cơ bản", price: 650_000 },
] as const;

export const CLEANING_ADD_ON_OPTIONS = [
  { id: "aircon", label: "Vệ sinh máy lạnh", price: 250_000 },
  { id: "laundry", label: "Giặt sấy chăn ga", price: 180_000 },
  { id: "trash", label: "Thu gom & xử lý rác", price: 120_000 },
] as const;

export type MovingItemId = (typeof MOVING_ITEM_OPTIONS)[number]["id"];
export type CleaningTypeId = (typeof CLEANING_TYPE_OPTIONS)[number]["id"];
export type CleaningAddOnId = (typeof CLEANING_ADD_ON_OPTIONS)[number]["id"];

interface MovingEstimateInput {
  floorPickup: number;
  floorDestination: number;
  hasElevatorPickup: boolean;
  hasElevatorDestination: boolean;
  items: MovingItemId[];
}

interface CleaningEstimateInput {
  cleaningType: CleaningTypeId;
  numRooms: number;
  numBathrooms: number;
  addOns: CleaningAddOnId[];
}

const MOVING_BASE_PRICE = 280_000;
const MOVING_PER_FLOOR_PRICE = 65_000;
const MOVING_NO_ELEVATOR_SURCHARGE = 90_000;
const CLEANING_EXTRA_ROOM_PRICE = 140_000;
const CLEANING_EXTRA_BATHROOM_PRICE = 90_000;

export function calculateMovingEstimate(input: MovingEstimateInput): number {
  const itemsTotal = input.items.reduce((total, itemId) => {
    const item = MOVING_ITEM_OPTIONS.find((option) => option.id === itemId);
    return total + (item?.price ?? 0);
  }, 0);

  const pickupAccessFee = calculateAccessFee(input.floorPickup, input.hasElevatorPickup);
  const destinationAccessFee = calculateAccessFee(
    input.floorDestination,
    input.hasElevatorDestination,
  );

  return MOVING_BASE_PRICE + itemsTotal + pickupAccessFee + destinationAccessFee;
}

export function calculateCleaningEstimate(input: CleaningEstimateInput): number {
  const basePrice =
    CLEANING_TYPE_OPTIONS.find((type) => type.id === input.cleaningType)?.price ?? 0;
  const roomSurcharge = Math.max(input.numRooms - 1, 0) * CLEANING_EXTRA_ROOM_PRICE;
  const bathroomSurcharge =
    Math.max(input.numBathrooms - 1, 0) * CLEANING_EXTRA_BATHROOM_PRICE;
  const addOnPrice = input.addOns.reduce((total, addOnId) => {
    const addOn = CLEANING_ADD_ON_OPTIONS.find((option) => option.id === addOnId);
    return total + (addOn?.price ?? 0);
  }, 0);

  return basePrice + roomSurcharge + bathroomSurcharge + addOnPrice;
}

export function calculateStudentDiscount(subtotal: number, isEligible: boolean): number {
  if (!isEligible) {
    return 0;
  }

  return Math.round(subtotal * STUDENT_DISCOUNT_RATE);
}

export function calculateFinalPrice(subtotal: number, isEligible: boolean): number {
  return subtotal - calculateStudentDiscount(subtotal, isEligible);
}

function calculateAccessFee(floor: number, hasElevator: boolean): number {
  const safeFloor = Math.max(1, Math.floor(floor || 1));
  const extraFloors = Math.max(safeFloor - 1, 0);

  if (extraFloors === 0) {
    return 0;
  }

  if (hasElevator) {
    return extraFloors * Math.round(MOVING_PER_FLOOR_PRICE * 0.4);
  }

  return extraFloors * MOVING_PER_FLOOR_PRICE + MOVING_NO_ELEVATOR_SURCHARGE;
}
