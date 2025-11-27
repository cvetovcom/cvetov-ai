# AI Shopping Assistant для Цветов.ру

Интеллектуальный помощник для заказа цветов с доставкой на базе Claude 3.5 Sonnet.

## Структура проекта

```
cvetov-ai/
├── frontend/          # Next.js 14 фронтенд (порт 3002)
├── api/              # Fastify API с Claude интеграцией (порт 8000)
└── docs/             # Документация (ТЗ и дизайн)
```

## Технологии

### Frontend
- Next.js 14 (Static Export для Firebase Hosting)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Firebase (hosting + analytics)

### API
- Node.js + Fastify
- TypeScript
- Anthropic Claude SDK
- Axios (для связи с backend API)

## Быстрый старт

### 1. Установка зависимостей

```bash
# Frontend
cd frontend
npm install

# API
cd ../api
npm install
```

### 2. Настройка переменных окружения

Frontend и API уже настроены с .env файлами:
- `frontend/.env.local` - Firebase config + API URLs
- `api/.env` - Anthropic API key + Backend URL

### 3. Запуск в режиме разработки

```bash
# Терминал 1: API (порт 8000)
cd api
npm run dev

# Терминал 2: Frontend (порт 3002)
cd frontend
npm run dev
```

### 4. Открыть приложение

- Frontend: http://localhost:3002
- API Health Check: http://localhost:8000/health

## Firebase Setup

### Проект
- Project ID: `cvetov-ai`
- Console: https://console.firebase.google.com/project/cvetov-ai

### Настройка Hosting

```bash
cd frontend
npm install -g firebase-tools
firebase login
firebase init hosting
# Выбрать проект: cvetov-ai
# Public directory: out
# Single-page app: Yes
```

### Деплой Frontend

```bash
cd frontend
npm run build      # Создает статический экспорт в ./out
firebase deploy --only hosting
```

## API Deployment (Google Cloud Run)

```bash
cd api
gcloud run deploy cvetov-ai-api \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=<your-key>,BACKEND_API_URL=https://site.demo.cvetov24.ru/api
```

## DNS Configuration

### ai.cvetov.com (Frontend)
```
Type: A
Name: ai
Value: 151.101.1.195

Type: A
Name: ai
Value: 151.101.65.195
```

После добавления DNS записей:
1. Firebase Console → Hosting → Add custom domain
2. Ввести: ai.cvetov.com
3. Добавить TXT запись для верификации (Firebase покажет значение)

### ai.cvetov24.ru (API - Cloud Run)
```
Type: CNAME
Name: ai
Value: ghs.googlehosted.com.
```

После добавления CNAME:
1. Google Cloud Console → Cloud Run → Domain Mappings
2. Map custom domain: ai.cvetov24.ru

## Разработка

### Frontend Scripts
```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint
```

### API Scripts
```bash
npm run dev        # Development with tsx watch
npm run build      # TypeScript compilation
npm start          # Production server
npm run type-check # TypeScript type checking
```

## Архитектура

### Фронтенд (Next.js Static)
- Static Site Generation (SSG)
- Client-side routing
- API calls через fetch к Fastify API

### API (Fastify)
- REST endpoints для чата
- Server-Sent Events (SSE) для streaming
- Claude 3.5 Sonnet integration
- Tool calling для поиска товаров
- Проксирование к Cvetov.ru Backend API

### Backend Integration
- Существующий FastAPI backend: `https://site.demo.cvetov24.ru/api`
- Endpoints для работы:
  - POST `/v3/catalog/products/search` - поиск товаров
  - POST `/v1/orders/create` - создание заказа

## Переменные окружения

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=https://site.demo.cvetov24.ru/api
```

### API (.env)
```env
PORT=8000
ANTHROPIC_API_KEY=sk-ant-api03-...
BACKEND_API_URL=https://site.demo.cvetov24.ru/api
CORS_ORIGIN=http://localhost:3002
```

## Лицензия

Proprietary - Cvetov.ru © 2024
