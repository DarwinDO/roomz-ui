import { expect, test } from '@playwright/test';

const COMMUNITY_API = 'https://vevnoxlgwisdottaifdn.supabase.co/rest/v1/community_posts**';
const BASE_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
  'content-type': 'application/json',
};

const communityPosts = [
  {
    id: 'community-post-1',
    user_id: 'user-1',
    type: 'story',
    title: 'Bài chia sẻ mới',
    content: 'Kinh nghiệm ở ghép tuần đầu tiên.',
    images: [],
    likes_count: 2,
    comments_count: 1,
    status: 'active',
    created_at: '2026-03-26T08:00:00.000Z',
    updated_at: '2026-03-26T08:00:00.000Z',
    author: {
      id: 'user-1',
      full_name: 'Lan Anh',
      role: 'student',
      avatar_url: null,
      email_verified: true,
    },
  },
  {
    id: 'community-post-2',
    user_id: 'user-2',
    type: 'story',
    title: 'Bài chia sẻ ảnh',
    content: 'Checklist chuyển trọ cuối tháng.',
    images: ['https://images.example.com/community-post-2.jpg'],
    likes_count: 1,
    comments_count: 0,
    status: 'active',
    created_at: '2026-03-25T08:00:00.000Z',
    updated_at: '2026-03-25T08:00:00.000Z',
    author: {
      id: 'user-2',
      full_name: 'Minh Khang',
      role: 'student',
      avatar_url: null,
      email_verified: true,
    },
  },
  {
    id: 'community-post-3',
    user_id: 'user-3',
    type: 'tip',
    title: 'Mẹo giữ cọc',
    content: 'Ba bước kiểm tra hợp đồng trước khi chuyển vào.',
    images: [],
    likes_count: 5,
    comments_count: 3,
    status: 'active',
    created_at: '2026-03-24T08:00:00.000Z',
    updated_at: '2026-03-24T08:00:00.000Z',
    author: {
      id: 'user-3',
      full_name: 'Thảo Vy',
      role: 'landlord',
      avatar_url: null,
      email_verified: true,
    },
  },
];

test.describe('community page', () => {
  test('renders fetched posts visibly in the featured feed even when the feed loads late', async ({ page }) => {
    await page.route(COMMUNITY_API, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: BASE_HEADERS,
          body: '',
        });
        return;
      }

      const requestUrl = new URL(route.request().url());
      const order = requestUrl.searchParams.get('order') ?? '';
      const payload = order.startsWith('likes_count.desc')
        ? [...communityPosts].sort((left, right) => right.likes_count - left.likes_count).slice(0, 3)
        : communityPosts;

      await new Promise((resolve) => setTimeout(resolve, 1200));

      await route.fulfill({
        status: 200,
        headers: BASE_HEADERS,
        body: JSON.stringify(payload),
      });
    });

    await page.goto('/community');

    await expect(page.getByRole('heading', { name: 'Bài chia sẻ mới' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bài chia sẻ ảnh' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mẹo giữ cọc' })).toBeVisible();
  });
});
