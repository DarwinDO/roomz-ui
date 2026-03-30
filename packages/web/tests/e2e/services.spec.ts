import { expect, test, type Page } from "@playwright/test";

const DEALS_API = "**/rest/v1/deals*";
const PARTNERS_API = "**/rest/v1/partners*";

function buildPartner(id: string, name: string) {
  return {
    id,
    name,
    category: "moving",
    specialization: `${name} specialization`,
    image_url: null,
    status: "active",
    rating: 4.8,
    review_count: 12,
  };
}

function buildDeal(index: number) {
  const partner = buildPartner(`deal-partner-${index}`, `Deal Partner ${index}`);

  return {
    id: `deal-${index}`,
    partner_id: partner.id,
    title: `Voucher deal ${index}`,
    discount_value: `${index * 5}%`,
    description: `Deal description ${index}`,
    valid_until: "2026-04-30T00:00:00.000Z",
    is_active: true,
    is_premium_only: false,
    created_at: `2026-03-${String(index).padStart(2, "0")}T00:00:00.000Z`,
    updated_at: `2026-03-${String(index).padStart(2, "0")}T00:00:00.000Z`,
    partner,
  };
}

async function mockServicesCatalog(
  page: Page,
  {
    deals,
    partners,
  }: {
    deals: ReturnType<typeof buildDeal>[];
    partners: ReturnType<typeof buildPartner>[];
  },
) {
  await page.route(DEALS_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(deals),
    });
  });

  await page.route(PARTNERS_API, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(partners),
    });
  });
}

test.describe("/services catalog expansion", () => {
  test("keeps extra deals and nearby partners in separate sections", async ({ page }) => {
    await mockServicesCatalog(page, {
      deals: Array.from({ length: 6 }, (_, index) => buildDeal(index + 1)),
      partners: [
        buildPartner("nearby-1", "Partner Nearby A"),
        buildPartner("nearby-2", "Partner Nearby B"),
        buildPartner("nearby-3", "Partner Nearby C"),
      ],
    });

    await page.goto("/services");

    const hotDeals = page.locator("#hot-deals-grid");

    await expect(hotDeals.getByText("Deal Partner 1")).toBeVisible();
    await expect(hotDeals.getByText("Deal Partner 6")).toHaveCount(0);
    await expect(hotDeals.getByText("Partner Nearby A")).toHaveCount(0);
    await expect(page.locator("#nearby-partners")).toHaveCount(0);

    await page.getByRole("button", { name: "Xem toàn bộ ưu đãi" }).click();

    await expect(hotDeals.getByText("Deal Partner 6")).toBeVisible();
    await expect(hotDeals.getByText("Partner Nearby A")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Thu gọn ưu đãi" })).toBeVisible();

    const nearbyPartners = page.locator("#nearby-partners-grid");
    await expect(nearbyPartners).toBeVisible();
    await expect(page.getByRole("button", { name: /Partner Nearby A/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Partner Nearby B/i })).toBeVisible();
  });

  test("switches the CTA to nearby partners when there are no extra deals to reveal", async ({
    page,
  }) => {
    await mockServicesCatalog(page, {
      deals: Array.from({ length: 4 }, (_, index) => buildDeal(index + 1)),
      partners: [
        buildPartner("nearby-1", "Partner Nearby A"),
        buildPartner("nearby-2", "Partner Nearby B"),
      ],
    });

    await page.goto("/services");

    const hotDeals = page.locator("#hot-deals-grid");

    await expect(page.getByRole("button", { name: "Xem đối tác gần bạn" })).toBeVisible();
    await expect(hotDeals.getByText("Partner Nearby A")).toHaveCount(0);

    await page.getByRole("button", { name: "Xem đối tác gần bạn" }).click();

    const nearbyPartners = page.locator("#nearby-partners-grid");
    await expect(nearbyPartners).toBeVisible();
    await expect(page.getByRole("button", { name: /Partner Nearby A/i })).toBeVisible();
    await expect(hotDeals.getByText("Partner Nearby A")).toHaveCount(0);
  });
});
