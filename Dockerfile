# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy all package files
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install root dependencies
RUN npm ci

# Install backend dependencies
RUN cd backend && npm ci

# Install frontend dependencies
RUN cd frontend && npm ci

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy source code
COPY . .

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Compile TypeSpec → OpenAPI
RUN npx tsp compile . --emit=@typespec/openapi3

# Generate frontend API types
RUN cd frontend && npx openapi-typescript ../tsp-output/@typespec/openapi3/openapi.yaml -o ./src/api/generated.ts

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy backend production artifacts
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json

# Copy frontend build artifacts
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy root package.json for metadata
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
