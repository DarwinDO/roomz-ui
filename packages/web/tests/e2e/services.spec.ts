import { expect, test } from "@playwright/test";

import {
  buildServiceDeal,
  buildServicePartner,
  mockServicesCatalog,
} from "./helpers/mockApi";

test.describe("/services catalog expansion", () => {
  test("keeps extra deals and nearby partners in separate sections", async ({ page }) => {
    await mockServicesCatalog(page, {
      deals: Array.from({ length: 6 }, (_, index) => buildServiceDeal(index + 1)),
      partners: [
        buildServicePartner("nearby-1", "Partner Nearby A"),
        buildServicePartner("nearby-2", "Partner Nearby B"),
        buildServicePartner("nearby-3", "Partner Nearby C"),
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
      deals: Array.from({ length: 4 }, (_, index) => buildServiceDeal(index + 1)),
      partners: [
        buildServicePartner("nearby-1", "Partner Nearby A"),
        buildServicePartner("nearby-2", "Partner Nearby B"),
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
