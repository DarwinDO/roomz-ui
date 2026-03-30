export const DEAL_PREVIEW_LIMIT = 4;

export interface ServicesHubCatalogState {
  canToggleCatalog: boolean;
  expandedPartnerCount: number;
  hasExtraDeals: boolean;
  hasPartners: boolean;
  revealTargetId: "hot-deals" | "nearby-partners";
  toggleLabel: string;
  visibleDealCount: number;
}

export function getServicesHubCatalogState(
  dealCount: number,
  partnerCount: number,
  isExpanded: boolean,
): ServicesHubCatalogState {
  const hasExtraDeals = dealCount > DEAL_PREVIEW_LIMIT;
  const hasPartners = partnerCount > 0;

  return {
    canToggleCatalog: hasExtraDeals || hasPartners,
    expandedPartnerCount: isExpanded ? partnerCount : 0,
    hasExtraDeals,
    hasPartners,
    revealTargetId: hasExtraDeals ? "hot-deals" : "nearby-partners",
    toggleLabel: isExpanded
      ? hasExtraDeals
        ? "Thu gọn ưu đãi"
        : "Ẩn đối tác gần bạn"
      : hasExtraDeals
        ? "Xem toàn bộ ưu đãi"
        : "Xem đối tác gần bạn",
    visibleDealCount: isExpanded ? dealCount : Math.min(dealCount, DEAL_PREVIEW_LIMIT),
  };
}
