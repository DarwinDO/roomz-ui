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

    await expect(
      page.getByRole('heading', { name: /Đang hiển thị 2 căn phòng tại Thành phố Hà Nội/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Quận Hai Bà Trưng, Thành phố Hà Nội/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Studio gần Bách Khoa/i })).toBeVisible();
    await expect(page.getByText(/Phòng riêng khu Bách Khoa/i)).toBeVisible();
  });
});
