import type { Partner } from "@/services/partners";

export type ServiceRequestMode = "repair" | "laundry" | "setup";
export type PartnerBookingTarget = "moving" | "cleaning" | "voucher" | ServiceRequestMode;

/** Categories that are voucher/lifestyle partners — no service booking applicable. */
const VOUCHER_CATEGORIES = new Set(["coffee", "food", "fitness", "gym", "workspace", "lifestyle"]);

export function getPartnerBookingTarget(partner: Pick<Partner, "category" | "specialization">): PartnerBookingTarget {
  if (partner.category && VOUCHER_CATEGORIES.has(partner.category)) {
    return "voucher";
  }

  switch (partner.category) {
    case "moving":
      return "moving";
    case "cleaning":
      return "cleaning";
    case "furniture":
      return "setup";
    case "utilities":
      return "repair";
    default:
      return inferBookingTargetFromSpecialization(partner.specialization);
  }
}

export function getPartnerBookingLabel(partner: Pick<Partner, "category" | "specialization">) {
  switch (getPartnerBookingTarget(partner)) {
    case "moving":
      return "Đặt dịch vụ chuyển phòng";
    case "cleaning":
      return "Đặt lịch dọn dẹp";
    case "setup":
      return "Yêu cầu lắp đặt";
    case "laundry":
      return "Yêu cầu giặt ủi";
    case "voucher":
      return "Xem ưu đãi & voucher";
    default:
      return "Gửi yêu cầu dịch vụ";
  }
}

/** Returns true for lifestyle/food partners where booking a service makes no sense. */
export function isVoucherPartner(partner: Pick<Partner, "category" | "specialization">) {
  return getPartnerBookingTarget(partner) === "voucher";
}

/**
 * Returns true when a partner is compatible with a given service_type from the leads table.
 * Used in the admin "Gán đối tác" dialog to filter the partner list.
 *
 * "support" leads accept any non-voucher partner.
 * All other service types require an exact match to the partner's booking target.
 */
export function isPartnerCompatibleWithServiceType(
  partner: Pick<Partner, "category" | "specialization">,
  serviceType: string,
): boolean {
  const target = getPartnerBookingTarget(partner);
  if (serviceType === "support") return target !== "voucher";
  return target === serviceType;
}

function inferBookingTargetFromSpecialization(specialization: string | null): PartnerBookingTarget {
  const s = specialization?.toLowerCase() ?? "";

  if (s.includes("giặt") || s.includes("ủi")) return "laundry";
  if (s.includes("lắp") || s.includes("setup") || s.includes("nội thất")) return "setup";
  if (s.includes("dọn") || s.includes("vệ sinh") || s.includes("giúp việc")) return "cleaning";
  if (s.includes("chuyển")) return "moving";

  // Food/lifestyle keywords → no booking
  if (
    s.includes("cà phê") ||
    s.includes("cafe") ||
    s.includes("ăn") ||
    s.includes("quán") ||
    s.includes("nhà hàng") ||
    s.includes("gym") ||
    s.includes("thể dục")
  ) {
    return "voucher";
  }

  return "repair";
}
