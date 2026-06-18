import { test as base, expect, Page, APIRequestContext } from '@playwright/test';

export const test = base.extend({});

export { expect } from '@playwright/test';

export async function selectTomorrow(page: Page) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDay = tomorrow.getDate();

  if (tomorrow.getMonth() !== today.getMonth()) {
    await page.getByLabel('Go to the Next Month').click();
  }

  await page.getByRole('gridcell', { name: new RegExp(tomorrowDay + ' ') }).getByRole('button').first().click();
}

const BACKEND_URL = 'http://localhost:3000/api';

export async function resetStore(request: APIRequestContext) {
  const response = await request.post(`${BACKEND_URL}/__test/reset`);
  expect(response.ok()).toBeTruthy();
}

export async function seedEventType(
  request: APIRequestContext,
  body: { name: string; description?: string; durationMinutes: number }
) {
  const response = await request.post(`${BACKEND_URL}/admin/event-types`, {
    data: body,
  });
  expect(response.ok()).toBeTruthy();
  const eventType = await response.json();

  return {
    eventType,
    cleanup: async () => {
      await request.delete(`${BACKEND_URL}/admin/event-types/${eventType.id}`);
    },
  };
}

export async function seedBooking(
  request: APIRequestContext,
  body: { slotId: string; guestName: string; guestEmail: string; notes?: string }
) {
  const response = await request.post(`${BACKEND_URL}/public/bookings`, {
    data: body,
  });
  expect(response.ok()).toBeTruthy();
  const booking = await response.json();

  return {
    booking,
    cleanup: async () => {
      // bookings не удаляются напрямую через API
    },
  };
}

export async function seedTestBooking(
  request: APIRequestContext,
  body: {
    id?: string;
    slotId: string;
    guestName: string;
    guestEmail: string;
    status: "confirmed" | "cancelled";
    notes?: string;
    createdAt?: string;
  }
) {
  const response = await request.post(`${BACKEND_URL}/__test/bookings`, {
    data: body,
  });
  expect(response.ok()).toBeTruthy();
  const booking = await response.json();

  return {
    booking,
    cleanup: async () => {
      // bookings не удаляются напрямую через API
    },
  };
}

export async function getSlots(
  request: APIRequestContext,
  eventTypeId: string,
  from?: string,
  to?: string
) {
  const url = new URL(`${BACKEND_URL}/public/event-types/${eventTypeId}/slots`);
  if (from) url.searchParams.set('from', from);
  if (to) url.searchParams.set('to', to);

  const response = await request.get(url.toString());
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function cancelBooking(request: APIRequestContext, id: string) {
  const response = await request.post(`${BACKEND_URL}/admin/bookings/${id}/cancel`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function restoreBooking(request: APIRequestContext, id: string) {
  const response = await request.post(`${BACKEND_URL}/admin/bookings/${id}/restore`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}
