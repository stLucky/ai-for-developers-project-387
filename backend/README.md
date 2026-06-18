# Call Booking Backend

Express + Zod + TypeScript backend для Call Booking API.

## Стек

- **Express** — HTTP сервер
- **Zod** — валидация запросов
- **TypeScript** — типизация
- **In-memory store** — данные в памяти (теряются при перезапуске)

## Запуск

```bash
cd backend
npm install
npm run dev      # dev server на localhost:3000
npm run build    # сборка в dist/
npm run start    # запуск production
```

## Интеграция с фронтендом

Для использования вместо Prism измените в `frontend/vite.config.ts`:

```ts
proxy: {
  "/api": {
    target: "http://localhost:3000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
}
```

## Структура

- `src/index.ts` — точка входа
- `src/routes/` — маршруты Express
- `src/store/` — in-memory хранилище и seed-данные
- `src/validators/` — Zod-схемы валидации
- `src/middleware/` — middleware (error handler, request validation)
- `src/utils/` — генерация слотов
