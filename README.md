### Hexlet tests and linter status:
[![Actions Status](https://github.com/stLucky/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/stLucky/ai-for-developers-project-387/actions)

## Call Booking API Spec

### TypeSpec Specification

API-контракт описан в `main.tsp` с использованием TypeSpec.

### Доменные сущности

- **Owner** — владелец календаря (единственный профиль по умолчанию)
- **EventType** — тип события (название, описание, длительность)
- **Slot** — временной интервал для бронирования
- **Booking** — бронирование гостем

### Установка зависимостей

```bash
npm install
```

### Компиляция спецификации

```bash
npx tsp compile . --emit=@typespec/openapi3
```

Результат: `tsp-output/@typespec/openapi3/openapi.yaml`

### Просмотр документации

- Онлайн: [Swagger Editor](https://editor.swagger.io) — импортировать `openapi.yaml`
- Локально: `npx @redocly/cli build-docs tsp-output/@typespec/openapi3/openapi.yaml -o docs.html`

## Docker

Соберите образ:

```bash
docker build -t call-booking .
```

Запустите контейнер:

```bash
docker run -p 3000:3000 -e PORT=3000 call-booking
```

Приложение будет доступно по адресу `http://localhost:3000`.

## Деплой

Приложение развёрнуто на Render:

https://ai-for-developers-project-387-qhdc.onrender.com/

## Запуск в production

Приложение запускается в едином контейнере:
- Frontend (React + Vite) собирается в статику
- Backend (Express) раздаёт API по `/api/*` и статику по `/`
- Порт задаётся переменной окружения `PORT`
