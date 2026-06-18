# Интеграционные тесты: пользовательские сценарии

## 1. Цель и объём

Документ описывает основные пользовательские сценарии (user journeys) для интеграционного тестирования сервиса **Call Booking**. Цель — гарантировать, что фронтенд и бэкенд работают вместе end-to-end, а ключевой путь бронирования проходит от начала до конца без регрессий.

**Входит:**
- Гостевой (публичный) поток бронирования
- Админский поток управления типами событий и бронированиями
- Критичные edge cases (конфликты, валидация, 404)
- Инструкция по настройке Playwright и тестовой среды

**Не входит:**
- Unit-тесты компонентов
- Тестирование производительности
- Тестирование безопасности (авторизация отсутствует по дизайну)

---

## 2. Архитектура тестовой среды

```
┌─────────────┐      /api       ┌─────────────┐
│  Playwright │  ─────────────→  │   Backend   │
│   (E2E)     │   (Vite proxy)   │  (Express)  │
│             │                  │  in-memory  │
│  Frontend   │  ←──────────────  │   store     │
│  (Vite 5173)│   HTTP / JSON    │             │
└─────────────┘                  └─────────────┘
```

**Компоненты:**
- **Backend**: Express + TypeScript, in-memory store (`store/eventTypes`, `store/bookings`). Поднимается на `localhost:3000`.
- **Frontend**: React 19 + Vite dev server на `localhost:5173`. Dev proxy перенаправляет `/api` на backend.
- **Playwright**: Headless (по умолчанию) или headed для отладки. Trace включается при падении.

**Принцип работы:**
- Перед каждым тестом через REST API (не через UI) создаём необходимые тестовые данные (owner, event types, bookings).
- Playwright открывает страницы фронтенда, выполняет действия как реальный пользователь, проверяет UI и URL.
- После теста store очищается (через API или через `page.evaluate` с вызовом внутреннего cleanup эндпоинта).

---

## 3. Критерии готовности (Definition of Done)

Тест считается написанным и рабочим, если:

1. **Проходит стабильно**: 5 последовательных запусков без flaky-фейлов.
2. **Самодостаточный**: не зависит от порядка выполнения других тестов.
3. **Сид через API**: данные создаются и удаляются программно, не через UI.
4. **Проверяет результат**: assert содержит проверку UI-элемента, URL или API-ответа.
5. **Отчётливый при падении**: при failure trace + скриншот помогают понять, что сломалось.

---

## 4. Сценарии

### 4.1 Гостевой поток — Happy Path

#### SC-G-01: Просмотр списка типов событий
**Предусловия:** В store есть 2 типа событий ("Консультация 30 мин", "Встреча 1 час").
**Шаги:**
1. Открыть `/public`.
2. Дождаться загрузки страницы.

**Ожидаемый результат:**
- Отображается заголовок "Доступные типы встреч".
- Видны оба типа событий с названием, описанием и длительностью.

#### SC-G-02: Выбор типа события, даты и слота
**Предусловия:** Существует тип события с длительностью 30 мин.
**Шаги:**
1. Открыть страницу типа события `/public/event-types/{id}`.
2. Дождаться загрузки календаря и боковой панели.
3. Выбрать дату (сегодня + 1 день).
4. Дождаться загрузки списка слотов.
5. Кликнуть на первый доступный слот.

**Ожидаемый результат:**
- Отображается форма оформления бронирования.
- В форме видна выбранная дата и время.

#### SC-G-03: Успешное бронирование
**Предусловия:** SC-G-02 выполнен, выбран доступный слот.
**Шаги:**
1. Заполнить поле "Имя": "Иван Петров".
2. Заполнить поле "Email": "ivan@example.com".
3. Заполнить поле "Заметки": "Хочу обсудить проект".
4. Нажать "Забронировать".

**Ожидаемый результат:**
- Появляется toast "Бронирование успешно!".
- Происходит редирект на `/public/bookings/{id}`.
- На странице подтверждения отображаются имя, email, статус "Подтверждено", дата создания.

#### SC-G-04: Просмотр подтверждения бронирования
**Предусловия:** Существует бронирование с id `{bookingId}`.
**Шаги:**
1. Открыть `/public/bookings/{bookingId}`.

**Ожидаемый результат:**
- Отображается заголовок "Бронирование подтверждено".
- Видны корректные данные гостя и статус.

---

### 4.2 Гостевой поток — Edge Cases

#### SC-G-05: Попытка бронирования уже занятого слота (409 Conflict)
**Предусловия:** Слот с id `{slotId}` уже забронирован (через API создано confirmed booking).
**Шаги:**
1. Открыть страницу типа события.
2. Выбрать дату и слот `{slotId}`.
3. Заполнить форму и нажать "Забронировать".

**Ожидаемый результат:**
- Появляется toast "Слот уже занят. Выберите другой.".
- Форма закрывается, возвращаемся к выбору слотов.
- Слот `{slotId}` больше не отображается как доступный (или отображается, но при повторной попытке снова 409).

#### SC-G-06: Попытка бронирования с невалидным email (422 ValidationError)
**Предусловия:** Открыта форма бронирования, слот выбран.
**Шаги:**
1. Заполнить "Имя": "Иван".
2. Заполнить "Email": "not-an-email".
3. Нажать "Забронировать".

**Ожидаемый результат:**
- Запрос не уходит (frontend-валидация Zod) ИЛИ возвращается 422 с toast "Некорректный слот. Выберите другой.".
- Поле Email подсвечено ошибкой.

#### SC-G-07: Доступ к несуществующему бронированию (404)
**Предусловия:** Нет.
**Шаги:**
1. Открыть `/public/bookings/non-existent-id`.

**Ожидаемый результат:**
- Отображается сообщение "Бронирование не найдено".

#### SC-G-08: Пустой список типов событий
**Предусловия:** В store нет ни одного типа события (предварительно удалить все через API).
**Шаги:**
1. Открыть `/public`.

**Ожидаемый результат:**
- Отображается заголовок "Нет доступных встреч".
- Виден fallback UI с сообщением "Организатор пока не добавил типы событий".

---

### 4.3 Админский поток — Happy Path

#### SC-A-01: Просмотр профиля владельца
**Предусловия:** Store содержит owner (seed по умолчанию).
**Шаги:**
1. Открыть `/admin`.

**Ожидаемый результат:**
- Отображается имя владельца, email, часовой пояс.
- Виден аватар (или инициалы при ошибке загрузки).

#### SC-A-02: Создание типа события
**Предусловия:** Нет.
**Шаги:**
1. Открыть `/admin/event-types/new`.
2. Заполнить "Название": "Встреча 1 час".
3. Заполнить "Описание": "Командная встреча".
4. Заполнить "Длительность": 60.
5. Нажать "Создать".

**Ожидаемый результат:**
- Редирект на `/admin/event-types`.
- В списке появляется новый тип события с корректными данными.

#### SC-A-03: Редактирование типа события
**Предусловия:** Существует тип события с id `{id}`.
**Шаги:**
1. Открыть `/admin/event-types/{id}/edit`.
2. Изменить "Название" на "Обновленная консультация".
3. Нажать "Сохранить".

**Ожидаемый результат:**
- Редирект на `/admin/event-types`.
- В списке отображается обновлённое название.

#### SC-A-04: Просмотр списка бронирований
**Предусловия:** В store есть 2 бронирования (confirmed и cancelled).
**Шаги:**
1. Открыть `/admin/bookings`.

**Ожидаемый результат:**
- Отображается таблица с обоими бронированиями.
- Видны имена гостей, email, статусы, даты.

#### SC-A-05: Отмена бронирования
**Предусловия:** Существует confirmed booking с id `{id}`.
**Шаги:**
1. Открыть `/admin/bookings/{id}`.
2. Нажать "Отменить".

**Ожидаемый результат:**
- Статус изменяется на "Отменено".
- Кнопка меняется на "Восстановить".

#### SC-A-06: Восстановление бронирования
**Предусловия:** Существует cancelled booking с id `{id}`.
**Шаги:**
1. Открыть `/admin/bookings/{id}`.
2. Нажать "Восстановить".

**Ожидаемый результат:**
- Статус изменяется на "Подтверждено".
- Кнопка меняется на "Отменить".

---

### 4.4 Админский поток — Edge Cases

#### SC-A-07: Удаление типа события, на который есть бронирования
**Предусловия:** Существует тип события с id `{id}`, на который есть хотя бы одно confirmed booking.
**Шаги:**
1. Открыть `/admin/event-types`.
2. Нажать "Удалить" на карточке типа события.

**Ожидаемый результат:**
- Тип события удаляется из списка.
- Бронирования в `/admin/bookings` по-прежнему видны (backend не каскадит удаление, booking остаётся в store с невалидным slotId — это ожидаемое текущее поведение).

#### SC-A-08: Восстановление бронирования, когда слот уже занят другим (409 Conflict)
**Предусловия:** Существует cancelled booking A на slot X. Существует confirmed booking B на тот же slot X.
**Шаги:**
1. Открыть `/admin/bookings/{idA}`.
2. Нажать "Восстановить".

**Ожидаемый результат:**
- Отображается ошибка (toast или alert): "Слот уже занят".
- Статус бронирования A остаётся "Отменено".

#### SC-A-09: Доступ к несуществующему типу события (404)
**Предусловия:** Нет.
**Шаги:**
1. Открыть `/admin/event-types/non-existent-id/edit`.

**Ожидаемый результат:**
- Отображается сообщение об ошибке "Тип события не найден" или редирект на список с уведомлением.

---

## 5. Тестовые данные (seed через API)

**Принцип:** Каждый тест создаёт данные сам через API-клиент Playwright (`request.post` / `request.delete`) в `beforeEach` или внутри теста.

**Базовый seed (применяется перед большинством тестов):**

```http
POST /admin/event-types
Content-Type: application/json

{
  "name": "Консультация 30 мин",
  "description": "Индивидуальная консультация",
  "durationMinutes": 30
}
```

```http
POST /admin/event-types
Content-Type: application/json

{
  "name": "Встреча 1 час",
  "description": "Командная встреча",
  "durationMinutes": 60
}
```

**Для edge cases:**
- `SC-G-05`: Создать бронирование через `POST /public/bookings` на конкретный `slotId` (полученный через `GET /public/event-types/{id}/slots`).
- `SC-A-08`: Создать два бронирования на один slot — первое confirmed, второе cancelled, затем пытаться восстановить второе.

**Cleanup:** После теста удалить созданные event types через `DELETE /admin/event-types/{id}` ( bookings очищаются каскадно или вручную через `DELETE` — если backend не поддерживает, можно добавить внутренний cleanup эндпоинт или сбрасывать `store` через `page.evaluate` с вызовом `window.__cleanupStore()`).

---

## 6. Порядок выполнения (Milestones)

### Milestone 1: Настройка инфраструктуры
- Установить Playwright.
- Создать `playwright.config.ts`.
- Настроить `baseURL` и `webServer`.
- Создать `tests/fixtures.ts` с seed/cleanup хуками.
- Убедиться, что `npm run test:e2e` запускает тесты.

### Milestone 2: Гостевой Happy Path
- `SC-G-01`: Просмотр списка типов событий
- `SC-G-02`: Выбор даты и слота
- `SC-G-03`: Успешное бронирование
- `SC-G-04`: Просмотр подтверждения

### Milestone 3: Гостевые Edge Cases
- `SC-G-05`: 409 Conflict (занятый слот)
- `SC-G-06`: 422 ValidationError (невалидный email)
- `SC-G-07`: 404 (несуществующее бронирование)
- `SC-G-08`: Пустой список типов событий

### Milestone 4: Админский Happy Path
- `SC-A-01`: Профиль владельца
- `SC-A-02`: Создание типа события
- `SC-A-03`: Редактирование типа события
- `SC-A-04`: Список бронирований
- `SC-A-05`: Отмена бронирования
- `SC-A-06`: Восстановление бронирования

### Milestone 5: Админские Edge Cases
- `SC-A-07`: Удаление типа события с бронированиями
- `SC-A-08`: 409 Conflict при восстановлении
- `SC-A-09`: 404 (несуществующий тип события)

### Milestone 6: CI/CD
- Добавить `npm run test:e2e` в GitHub Actions (или другой CI).
- Включить `trace: 'on-first-retry'` для отладки flaky-тестов.
- Сохранять артефакты (screenshots, traces) в CI.

---

## 7. Приложение: Установка и конфигурация Playwright

### 7.1 Установка

Выполнить из корня проекта:

```bash
cd frontend
npm init playwright@latest
```

При установке выбрать:
- **TypeScript**: Yes
- **tests directory**: `tests` (или `e2e` — на твой выбор)
- **Add GitHub Actions**: Yes (если нужен CI)
- **Install browsers**: Yes

Установить дополнительно (если нужно разделять dev/prod):

```bash
npm install --save-dev dotenv
```

### 7.2 Структура тестов

```
frontend/
  tests/
    fixtures.ts          # Кастомные фикстуры (seed + cleanup)
    public/
      event-types.spec.ts   # SC-G-01..08
    admin/
      dashboard.spec.ts     # SC-A-01
      event-types.spec.ts   # SC-A-02, 03, 07, 09
      bookings.spec.ts      # SC-A-04, 05, 06, 08
```

### 7.3 Конфигурация `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      // Backend
      command: 'cd .. && npm run backend:dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // Frontend
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
```

### 7.4 Фикстура для seed через API

Создать `tests/fixtures.ts`:

```typescript
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Автоматически создаёт API-контекст, привязанный к backend
  apiContext: async ({}, use) => {
    // не используем здесь — seed делаем внутри тестов через request
    await use(undefined);
  },
});

export { expect } from '@playwright/test';

/**
 * Хелпер для seed типа события.
 * Возвращает созданный объект и функцию cleanup.
 */
export async function seedEventType(request: any, body: {
  name: string;
  description?: string;
  durationMinutes: number;
}) {
  const response = await request.post('http://localhost:3000/admin/event-types', {
    data: body,
  });
  expect(response.ok()).toBeTruthy();
  const eventType = await response.json();

  return {
    eventType,
    cleanup: async () => {
      await request.delete(`http://localhost:3000/admin/event-types/${eventType.id}`);
    },
  };
}

/**
 * Хелпер для seed бронирования.
 */
export async function seedBooking(request: any, body: {
  slotId: string;
  guestName: string;
  guestEmail: string;
  notes?: string;
}) {
  const response = await request.post('http://localhost:3000/public/bookings', {
    data: body,
  });
  expect(response.ok()).toBeTruthy();
  const booking = await response.json();

  return {
    booking,
    cleanup: async () => {
      // bookings не удаляются напрямую, можно сделать через admin если нужно
      // или через внутренний cleanup
    },
  };
}
```

### 7.5 Пример теста

```typescript
import { test, expect, seedEventType } from '../fixtures';

test('SC-G-01: просмотр списка типов событий', async ({ page, request }) => {
  const { eventType, cleanup } = await seedEventType(request, {
    name: 'Консультация 30 мин',
    durationMinutes: 30,
  });

  await page.goto('/public');
  await expect(page.getByText('Доступные типы встреч')).toBeVisible();
  await expect(page.getByText('Консультация 30 мин')).toBeVisible();

  await cleanup();
});
```

### 7.6 Запуск тестов

```bash
# Все тесты
npx playwright test

# Только public
npx playwright test tests/public

# С открытым браузером (headed)
npx playwright test --headed

# С отчётом
npx playwright show-report
```

### 7.7 Важные нюансы

1. **Время и даты**: `generateSlots()` использует `new Date()` на backend. Для стабильности:
   - В seed всегда создавать `EventType` с `durationMinutes`, кратным 30 или 60.
   - В UI выбирать дату через `today + 1 day` (Playwright может кликнуть на нужную дату в календаре через `page.getByRole('gridcell', { name: '15' }).click()`).
   - Альтернатива: mock `Date.now` на backend через `page.evaluate` перед тестом (если нужна детерминированность).

2. **Store reset**: In-memory store не персистентен между перезапусками backend, но если backend работает во время всех тестов — данные накапливаются.
   - **Решение**: Добавить в backend скрытый `POST /__test/reset` (только для `NODE_ENV=test`) и вызывать его в `globalSetup` или `beforeEach`.
   - Или: запускать backend отдельно для каждого теста (медленно, но изолированно).
   - Или: использовать `reuseExistingServer: false` в CI.

3. **Proxy**: `baseURL` в Playwright указывает на `http://localhost:5173` (frontend). API-запросы в фикстурах (`seedEventType`) идут напрямую на `http://localhost:3000` (backend), минуя прокси.

4. **Timeouts**: `webServer` timeout 120 секунд — Vite + backend могут долго стартовать первый раз.

---

*Последнее обновление: 15 июня 2026*
