import { expect, test } from '@playwright/test';
import { mockSearchFlow } from './helpers/mockApi';

test.describe('search with location selection', () => {
  test('mapbox selection updates active area and room results', async ({ page }) => {
    await mockSearchFlow(page);

    await page.goto('/search');

    const searchInput = page.getByRole('combobox', {
      name: /Tìm theo địa chỉ, khu vực hoặc trường học/i,
    });

    await searchInput.fill('bách khoa');

    const locationOption = page.getByRole('option', {
      name: /Đại học Bách khoa Hà Nội/i,
    });

    await expect(locationOption).toBeVisible();
    await locationOption.click();

    await expect(page.getByText(/Đang tìm quanh:/i)).toBeVisible();
    await expect(
      page.getByText('Đại học Bách khoa Hà Nội, Thành phố Hà Nội', { exact: true })
    ).toBeVisible();
    await expect(page.getByText(/2 phòng còn trống/i)).toBeVisible();
    await expect(page.getByText(/Studio gần Bách Khoa/i)).toBeVisible();
    await expect(page.getByText(/Phòng riêng khu Bách Khoa/i)).toBeVisible();
  });
});
