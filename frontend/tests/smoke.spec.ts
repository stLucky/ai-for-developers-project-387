import { test, expect, resetStore } from './fixtures';

test('smoke: backend reset и frontend загрузка', async ({ page, request }) => {
  await resetStore(request);
  await page.goto('/public');
  await expect(page.getByText('Нет доступных встреч')).toBeVisible();
});
