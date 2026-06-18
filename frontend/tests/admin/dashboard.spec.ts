import { test, expect, resetStore } from '../fixtures';

test.describe('SC-A: Админский поток — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-A-01: Просмотр профиля владельца', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Администрирование')).toBeVisible();
    await expect(page.getByText('Анна Смирнова')).toBeVisible();
    await expect(page.getByText('anna@example.com')).toBeVisible();
    await expect(page.getByText('Europe/Moscow')).toBeVisible();
  });
});
