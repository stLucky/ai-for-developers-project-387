# Agent Instructions

## Project Layout

- Root: **TypeSpec API contract** (`main.tsp`) + shared tooling.
- `frontend/`: **React 19 + Vite** app consuming the API.
- `backend/`: **Express + TypeScript** API server.
- `tsp-output/`: **Generated** — do not edit directly. Recompile from `main.tsp`.

## Critical Commands

### TypeSpec → OpenAPI
```bash
npx tsp compile . --emit=@typespec/openapi3
```
Output: `tsp-output/@typespec/openapi3/openapi.yaml`

### Frontend (run from `frontend/`)
```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # tsc + vite build
npm run lint         # eslint
npm run type-check   # tsc --noEmit (type check only)
npm run api:generate # openapi-typescript → src/api/generated.ts
```

### Backend (run from root)
```bash
npm run backend:install  # npm install in backend/
npm run backend:dev      # nodemon + tsx (port 3000)
npm run backend:build    # tsc
npm run backend:start    # node dist/index.js (port 3000)
```

### Mock API (run from root)
```bash
npm run prism        # Stoplight Prism on port 4010
```

### Convenience (run from root)
```bash
npm run frontend:dev
npm run frontend:build
npm run frontend:install
npm run backend:dev
npm run backend:build
npm run backend:start
npm run api:generate # runs frontend's api:generate
```

## Architecture & Tooling

- **API client**: `openapi-fetch` typed from `src/api/generated.ts`.
- **State**: React Query (`@tanstack/react-query`), devtools enabled.
- **Styling**: Tailwind CSS + shadcn/ui (style `new-york`, `rsc: false`).
- **Routing**: `react-router-dom` with `createBrowserRouter`.
  - `/admin/*` — admin layout
  - `/public/*` — public layout
  - `/` — redirects to `/public`
- **Path aliases**: `@/` → `src/` (Vite + TypeScript both configured).
- **Dev proxy**: Vite proxies `/api` → `http://localhost:3000` (backend) by default.
  - Override via `VITE_API_TARGET` env variable (e.g., `VITE_API_TARGET=http://localhost:4010` for Prism mock).
  - The `api` client uses `baseUrl: "/api"`.

## Codegen Workflow

1. Edit `main.tsp`.
2. Recompile: `npx tsp compile . --emit=@typespec/openapi3`.
3. Regenerate frontend types: `npm run api:generate` (from root or `frontend/`).
4. Frontend code in `src/api/hooks.ts` and pages depends on `src/api/generated.ts`.

## Constraints

- `main.tsp` is the single source of truth for the API contract.
- No auth, no accounts — the API has a hardcoded single owner.
- `tsp-output/` and `frontend/src/api/generated.ts` are generated artifacts.
