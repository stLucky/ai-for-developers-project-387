import { test, expect, resetStore, seedEventType, seedBooking, getSlots, cancelBooking, seedTestBooking } from '../fixtures';
import { format, startOfDay, endOfDay } from 'date-fns';

test.describe('SC-A: Админский поток — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-A-04: Просмотр списка бронирований', async ({ page, request }) => {
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
    const secondSlot = slots[1];

    await seedBooking(request, {
      slotId: firstSlot.id,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    });

    const { booking: cancelledBooking } = await seedBooking(request, {
      slotId: secondSlot.id,
      guestName: 'Мария Иванова',
      guestEmail: 'maria@example.com',
    });

    await cancelBooking(request, cancelledBooking.id);

    await page.goto('/admin/bookings');
    await expect(page.getByText('Бронирования')).toBeVisible();
    await expect(page.getByText('Иван Петров')).toBeVisible();
    await expect(page.getByText('ivan@example.com')).toBeVisible();
    await expect(page.getByText('Подтверждено').first()).toBeVisible();
    await expect(page.getByText('Мария Иванова')).toBeVisible();
    await expect(page.getByText('maria@example.com')).toBeVisible();
    await expect(page.getByText('Отменено').first()).toBeVisible();
  });

  test('SC-A-05: Отмена бронирования', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const from = format(startOfDay(tomorrow), "yyyy-MM-dd'T'00:00:00'Z'");
    const to = format(endOfDay(tomorrow), "yyyy-MM-dd'T'23:59:59'Z'");

    const slots = await getSlots(request, eventType.id, from, to);
    const { booking } = await seedBooking(request, {
      slotId: slots[0].id,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    });

    await page.goto(`/admin/bookings/${booking.id}`);
    await expect(page.getByText('Детали бронирования').first()).toBeVisible();
    await expect(page.getByText('Подтверждено').first()).toBeVisible();

    await page.getByRole('button', { name: 'Отменить бронирование' }).click();

    await expect(page.getByText('Отменено').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Восстановить бронирование' })).toBeVisible();
  });

  test('SC-A-06: Восстановление бронирования', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const from = format(startOfDay(tomorrow), "yyyy-MM-dd'T'00:00:00'Z'");
    const to = format(endOfDay(tomorrow), "yyyy-MM-dd'T'23:59:59'Z'");

    const slots = await getSlots(request, eventType.id, from, to);
    const { booking } = await seedBooking(request, {
      slotId: slots[0].id,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    });

    await cancelBooking(request, booking.id);

    await page.goto(`/admin/bookings/${booking.id}`);
    await expect(page.getByText('Детали бронирования').first()).toBeVisible();
    await expect(page.getByText('Отменено').first()).toBeVisible();

    await page.getByRole('button', { name: 'Восстановить бронирование' }).click();

    await expect(page.getByText('Подтверждено').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Отменить бронирование' })).toBeVisible();
  });
});

test.describe('SC-A: Админский поток — Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-A-08: Восстановление бронирования, когда слот уже занят другим (409 Conflict)', async ({ page, request }) => {
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
      guestName: 'Первый Гость',
      guestEmail: 'first@example.com',
    });

    const { booking: bookingB } = await seedTestBooking(request, {
      slotId: firstSlot.id,
      guestName: 'Второй Гость',
      guestEmail: 'second@example.com',
      status: 'cancelled',
    });

    await page.goto(`/admin/bookings/${bookingB.id}`);
    await expect(page.getByText('Детали бронирования').first()).toBeVisible();
    await expect(page.getByText('Отменено').first()).toBeVisible();

    await page.getByRole('button', { name: 'Восстановить бронирование' }).click();

    await expect(page.getByText('Слот уже занят другим бронированием')).toBeVisible();
    await expect(page.getByText('Отменено').first()).toBeVisible();
  });
});
