import { test, expect, resetStore, seedEventType, seedBooking, getSlots, selectTomorrow } from '../fixtures';
import { format, startOfDay, endOfDay } from 'date-fns';

test.describe('SC-G: Гостевой поток — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-G-01: Просмотр списка типов событий', async ({ page, request }) => {
    await seedEventType(request, {
      name: 'Консультация 30 мин',
      description: 'Индивидуальная консультация',
      durationMinutes: 30,
    });
    await seedEventType(request, {
      name: 'Встреча 1 час',
      description: 'Командная встреча',
      durationMinutes: 60,
    });

    await page.goto('/public');
    await expect(page.getByText('Доступные типы встреч')).toBeVisible();
    await expect(page.getByText('Консультация 30 мин').first()).toBeVisible();
    await expect(page.getByText('Индивидуальная консультация').first()).toBeVisible();
    await expect(page.getByText('Встреча 1 час').first()).toBeVisible();
    await expect(page.getByText('Командная встреча').first()).toBeVisible();
    await expect(page.getByText('Длительность: 30 мин').first()).toBeVisible();
    await expect(page.getByText('Длительность: 60 мин').first()).toBeVisible();
  });

  test('SC-G-02: Выбор типа события, даты и слота', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    await page.goto(`/public/event-types/${eventType.id}`);
    await expect(page.getByRole('heading', { name: 'Консультация 30 мин' })).toBeVisible();
    await expect(page.getByText('30 мин').first()).toBeVisible();

    await selectTomorrow(page);

    // Wait for the first slot button (e.g., "09:00") to appear
    await expect(page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()).toBeVisible();

    // Click the first available slot
    const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await firstSlot.click();

    // Assert the booking form is shown
    await expect(page.getByText('Оформление бронирования')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Забронировать' })).toBeVisible();
  });

  test('SC-G-03: Успешное бронирование', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    await page.goto(`/public/event-types/${eventType.id}`);
    await selectTomorrow(page);

    await expect(page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()).toBeVisible();
    const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await firstSlot.click();

    await expect(page.getByText('Оформление бронирования')).toBeVisible();

    await page.getByLabel('Имя').fill('Иван Петров');
    await page.getByLabel('Email').fill('ivan@example.com');
    await page.getByLabel('Заметки').fill('Хочу обсудить проект');

    await page.getByRole('button', { name: 'Забронировать' }).click();

    await expect(page.getByText('Бронирование успешно!')).toBeVisible();
    await expect(page).toHaveURL(/\/public\/bookings\/.+/);
    await expect(page.getByText('Бронирование подтверждено')).toBeVisible();
    await expect(page.getByText('Иван Петров')).toBeVisible();
    await expect(page.getByText('ivan@example.com')).toBeVisible();
    await expect(page.getByText('Подтверждено', { exact: true })).toBeVisible();
  });

  test('SC-G-04: Просмотр подтверждения бронирования', async ({ page, request }) => {
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

    const { booking } = await seedBooking(request, {
      slotId: firstSlot.id,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
      notes: 'Хочу обсудить проект',
    });

    await page.goto(`/public/bookings/${booking.id}`);
    await expect(page.getByText('Бронирование подтверждено')).toBeVisible();
    await expect(page.getByText('Иван Петров')).toBeVisible();
    await expect(page.getByText('ivan@example.com')).toBeVisible();
    await expect(page.getByText('Подтверждено', { exact: true })).toBeVisible();
  });
});

test.describe('SC-G: Гостевой поток — Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await resetStore(request);
  });

  test('SC-G-05: Попытка бронирования уже занятого слота (409 Conflict)', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    await page.goto(`/public/event-types/${eventType.id}`);
    await selectTomorrow(page);

    await expect(page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()).toBeVisible();
    const firstSlotButton = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    const slotId = await firstSlotButton.getAttribute('data-slot-id');
    await firstSlotButton.click();

    // Забронируем выбранный слот напрямую через API
    await seedBooking(request, {
      slotId: slotId!,
      guestName: 'Первый Гость',
      guestEmail: 'first@example.com',
    });

    await expect(page.getByText('Оформление бронирования')).toBeVisible();

    await page.getByLabel('Имя').fill('Иван Петров');
    await page.getByLabel('Email').fill('ivan@example.com');

    await page.getByRole('button', { name: 'Забронировать' }).click();

    // Проверяем toast с ошибкой 409
    await expect(page.getByText('Слот уже занят. Выберите другой.')).toBeVisible();

    // Форма закрывается, возвращаемся к выбору слотов
    await expect(page.getByText('Оформление бронирования')).not.toBeVisible();
    await expect(page.getByText('Выберите дату')).toBeVisible();
  });

  test('SC-G-06: Попытка бронирования с невалидным email (ValidationError)', async ({ page, request }) => {
    const { eventType } = await seedEventType(request, {
      name: 'Консультация 30 мин',
      durationMinutes: 30,
    });

    await page.goto(`/public/event-types/${eventType.id}`);
    await selectTomorrow(page);

    await expect(page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()).toBeVisible();
    const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await firstSlot.click();

    await expect(page.getByText('Оформление бронирования')).toBeVisible();

    await page.getByLabel('Имя').fill('Иван');
    await page.getByLabel('Email').fill('not-an-email');

    await page.getByRole('button', { name: 'Забронировать' }).click();

    // Frontend-валидация Zod — запрос не уходит, ошибка inline под полем
    await expect(page.getByText('Некорректный email')).toBeVisible();
    await expect(page.getByText('Оформление бронирования')).toBeVisible();
  });

  test('SC-G-07: Доступ к несуществующему бронированию (404)', async ({ page }) => {
    await page.goto('/public/bookings/non-existent-id');
    await expect(page.getByText('Бронирование не найдено')).toBeVisible();
  });

  test('SC-G-08: Пустой список типов событий', async ({ page }) => {
    // store уже очищен в beforeEach
    await page.goto('/public');
    await expect(page.getByText('Нет доступных встреч')).toBeVisible();
    await expect(page.getByText('Организатор пока не добавил типы событий')).toBeVisible();
  });
});
