import { expect, test } from '@playwright/test';
import {
  loginAsAdmin,
  mockAdminAuth,
  mockAdminCrawlFlow,
} from './helpers/mockApi';

test.describe('admin crawl operations', () => {
  test('admin can run a crawl source and upload JSON into the review queue', async ({ page }) => {
    await mockAdminAuth(page);
    await mockAdminCrawlFlow(page);

    await loginAsAdmin(page);
    await page.getByRole('link', { name: /Duyệt Crawl/i }).click();
    await page.waitForURL('**/admin/ingestion-review');

    await expect(page.getByRole('heading', { name: /Duyệt crawl/i })).toBeVisible();
    await expect(page.getByText(/Crawl đối tác từ TopBrands/i)).toBeVisible();

    await page.getByRole('button', { name: /Chạy crawl/i }).first().click();
    await expect(page.getByText(/source_run/i)).toBeVisible();
    await expect(page.getByText(/Low confidence: 1/i)).toBeVisible();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'partner-upload.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          items: [
            {
              company_name: 'Taxi tải 24H',
              email: 'hi@taxitai24h.vn',
              phone: '0909999999',
              website: 'https://taxitai24h.vn',
              service_area: 'Thành phố Hồ Chí Minh',
            },
          ],
        }),
      ),
    });

    await page.getByRole('button', { name: /Upload vào staging queue/i }).click();
    await expect(page.getByText(/Taxi tải 24H/i).first()).toBeVisible();
  });
});
