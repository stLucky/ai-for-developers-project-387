import { test, expect, resetStore, seedEventType, seedBooking, getSlots } from '../fixtures';
import { format, startOfDay, endOfDay } from 'date-fns';

test.describe('SC-A: Админский поток — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-A-02: Создание типа события', async ({ page }) => {
    await page.goto('/admin/event-types/new');
    await expect(page.getByText('Новый тип события')).toBeVisible();

    await page.getByLabel('Название').fill('Встреча 1 час');
    await page.getByLabel('Описание').fill('Командная встреча');
    await page.getByLabel('Длительность (минуты)').fill('60');

    await page.getByRole('button', { name: 'Создать' }).click();

    await expect(page).toHaveURL(/\/admin\/event-types/);
    await expect(page.getByText('Встреча 1 час')).toBeVisible();
    await expect(page.getByText('Командная встреча')).toBeVisible();
    await expect(page.getByText('60').first()).toBeVisible();
  });

  test('SC-A-03: Редактирование типа события', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    await page.goto(`/admin/event-types/${eventType.id}/edit`);
    await expect(page.getByText('Редактирование типа события')).toBeVisible();

    await page.getByLabel('Название').fill('Обновленная консультация');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page).toHaveURL(/\/admin\/event-types/);
    await expect(page.getByText('Обновленная консультация')).toBeVisible();
  });
});

test.describe('SC-A: Админский поток — Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-A-07: Удаление типа события, на который есть бронирования', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const from = format(startOfDay(tomorrow), "yyyy-MM-dd'T'00:00:00'Z'");
    const to = format(endOfDay(tomorrow), "yyyy-MM-dd'T'23:59:59'Z'");

    const slots = await getSlots(request, eventType.id, from, to);
    const firstSlot = slots[0];

    await seedBooking(request, {
      slotId: firstSlot.id,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    });

    await page.goto('/admin/event-types');
    await expect(page.getByText('Консультация 30 мин')).toBeVisible();

    await page.getByRole('button', { name: 'Удалить' }).click();

    await expect(page.getByText('Тип события удален')).toBeVisible();
    await expect(page.getByText('Консультация 30 мин')).not.toBeVisible();

    await page.goto('/admin/bookings');
    await expect(page.getByText('Иван Петров')).toBeVisible();
    await expect(page.getByText('ivan@example.com')).toBeVisible();
  });

  test('SC-A-09: Доступ к несуществующему типу события (404)', async ({ page }) => {
    await page.goto('/admin/event-types/non-existent-id/edit');
    await expect(page.getByText('Тип события не найден')).toBeVisible();
  });
});
