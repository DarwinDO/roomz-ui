import { expect, test } from '@playwright/test';
import { loginAsAdmin, mockAdminAuth, mockAdminRoomsFlow } from './helpers/mockApi';

test.describe('admin room editor', () => {
  test('single successful save closes the drawer instead of reopening it', async ({ page }) => {
    await mockAdminAuth(page);
    const adminRooms = await mockAdminRoomsFlow(page);

    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Phòng trọ' }).click();

    const roomRow = page.locator('tr').filter({ hasText: 'Phòng thử nghiệm' });
    await roomRow.getByRole('button').click();
    await page.getByRole('menuitem', { name: 'Sửa phòng' }).click();

    const titleInput = page.locator('#room-title');
    await expect(titleInput).toBeVisible();

    await titleInput.fill('Phòng đã đổi tên');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

    await expect.poll(() => adminRooms.roomPatchCount).toBe(1);
    await expect(titleInput).toBeHidden();
    await expect(page.getByText('Phòng đã đổi tên')).toBeVisible();

    expect(adminRooms.lastRoomPatchBody?.title).toBe('Phòng đã đổi tên');
    expect(adminRooms.amenityUpsertCount).toBe(1);
    expect(adminRooms.imageDeleteCount).toBe(1);
    expect(adminRooms.imageInsertCount).toBe(1);
  });
});
