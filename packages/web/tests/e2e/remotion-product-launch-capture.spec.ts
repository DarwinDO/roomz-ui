import {mkdirSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {expect, test, type Locator, type Page} from "@playwright/test";

import {
  rommzProductLaunchHybridCaptureManifest,
  rommzProductLaunchHybridViewport,
  type RommzProductLaunchHybridCaptureId,
} from "../../src/remotion/captures/rommzProductLaunchHybridCaptures";
import {
  loginAsMockedRenter,
  mockPaymentPageData,
  mockRomiProductConciergeFlow,
  mockSearchFlow,
  mockServicesCatalog,
} from "./helpers/mockApi";

test.describe.configure({mode: "serial"});
test.use({viewport: rommzProductLaunchHybridViewport});

const captureOutputDir = process.env.ROMMZ_CAPTURE_OUTPUT_DIR
  ? resolve(process.env.ROMMZ_CAPTURE_OUTPUT_DIR)
  : resolve(process.cwd(), ".tmp", "remotion", "captures");

const screenshotOptions = {
  animations: "disabled" as const,
  scale: "device" as const,
};

const capturePath = (captureId: RommzProductLaunchHybridCaptureId) => {
  return resolve(captureOutputDir, rommzProductLaunchHybridCaptureManifest[captureId].fileName);
};

const saveCapture = async ({
  captureId,
  locator,
  page,
}: {
  captureId: RommzProductLaunchHybridCaptureId;
  locator?: Locator;
  page: Page;
}) => {
  const outputPath = capturePath(captureId);
  mkdirSync(dirname(outputPath), {recursive: true});

  if (locator) {
    await locator.screenshot({
      ...screenshotOptions,
      path: outputPath,
    });
    return;
  }

  await page.screenshot({
    ...screenshotOptions,
    fullPage: false,
    path: outputPath,
  });
};

test("captures landing hero fold", async ({page}) => {
  await page.goto("/");
  await expect(page.getByRole("button", {name: "Tìm kiếm"})).toBeVisible();

  await saveCapture({
    captureId: "landing-hero",
    page,
  });
});

test("captures deterministic search results state", async ({page}) => {
  await mockSearchFlow(page);
  const searchParams = new URLSearchParams({
    q: "Đại học Bách khoa Hà Nội",
    address: "Đại học Bách khoa Hà Nội, Thành phố Hà Nội",
    city: "Thành phố Hà Nội",
    district: "Quận Hai Bà Trưng",
    lat: "21.005",
    lng: "105.843",
    radius: "5",
    location_source: "mapbox",
  });
  await page.goto(`/search?${searchParams.toString()}`);

  await expect(page.getByRole("heading", {name: /Đang hiển thị 2 căn phòng tại Thành phố Hà Nội/i})).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("heading", {name: /Studio gần Bách Khoa/i})).toBeVisible({timeout: 10000});

  await saveCapture({
    captureId: "search-results",
    page,
  });
});

test("captures romi concierge answer", async ({page}) => {
  await mockRomiProductConciergeFlow(page);
  await page.goto("/romi");

  await page
    .getByPlaceholder(/Nêu khu vực, ngân sách, câu hỏi sản phẩm/i)
    .fill("Tìm phòng gần metro ở Thủ Đức, tầm dưới 5 triệu");
  await page.getByRole("button", {name: /^Gửi$/}).click();

  await expect(page.getByText(/gom shortlist theo khu vực Thủ Đức/i)).toBeVisible();

  await saveCapture({
    captureId: "romi-chat",
    page,
  });
});

test("captures services deals fold", async ({page}) => {
  await mockServicesCatalog(page);
  await page.goto("/services");

  const dealsSection = page.locator("#hot-deals");
  await dealsSection.scrollIntoViewIfNeeded();
  await expect(page.getByText("Deal Partner 1")).toBeVisible();

  await saveCapture({
    captureId: "services-deals",
    page,
  });
});

test("captures payment pricing state without login redirect", async ({page}) => {
  await loginAsMockedRenter(page);
  await mockPaymentPageData(page);
  await page.goto("/payment");

  await expect(page).toHaveURL(/\/payment/);
  await expect(page.getByRole("heading", {name: /Nâng tầm trải nghiệm cùng RommZ\+/i})).toBeVisible();

  await saveCapture({
    captureId: "payment-pricing",
    page,
  });
});
