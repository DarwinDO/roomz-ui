import { describe, expect, test } from "vitest";

import { DEAL_PREVIEW_LIMIT, getServicesHubCatalogState } from "./servicesHubCatalog";

describe("getServicesHubCatalogState", () => {
  test("keeps partner cards out of the deals grid until the catalog is expanded", () => {
    const state = getServicesHubCatalogState(DEAL_PREVIEW_LIMIT + 2, 5, false);

    expect(state.canToggleCatalog).toBe(true);
    expect(state.hasExtraDeals).toBe(true);
    expect(state.hasPartners).toBe(true);
    expect(state.visibleDealCount).toBe(DEAL_PREVIEW_LIMIT);
    expect(state.expandedPartnerCount).toBe(0);
    expect(state.revealTargetId).toBe("hot-deals");
    expect(state.toggleLabel).toBe("Xem toàn bộ ưu đãi");
  });

  test("turns the CTA into a nearby-partners reveal when the deals preview is already exhausted", () => {
    const collapsed = getServicesHubCatalogState(DEAL_PREVIEW_LIMIT, 3, false);
    const expanded = getServicesHubCatalogState(DEAL_PREVIEW_LIMIT, 3, true);

    expect(collapsed.hasExtraDeals).toBe(false);
    expect(collapsed.visibleDealCount).toBe(DEAL_PREVIEW_LIMIT);
    expect(collapsed.expandedPartnerCount).toBe(0);
    expect(collapsed.revealTargetId).toBe("nearby-partners");
    expect(collapsed.toggleLabel).toBe("Xem đối tác gần bạn");

    expect(expanded.expandedPartnerCount).toBe(3);
    expect(expanded.toggleLabel).toBe("Ẩn đối tác gần bạn");
  });
});
