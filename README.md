# AI Shopping Assistant для Цветов.ру 🌸

AI-ассистент для подбора и покупки цветов через диалоговый интерфейс.

## 🚀 Развернутое приложение

**Live Demo:** https://ai.cvetov.com

## 📋 Текущий статус

✅ **Реализовано:**
- Чат-интерфейс в стиле ChatGPT
- Режим консультации (сбор параметров: кому, повод, город)
- Progress bar с индикацией заполнения параметров
- Типизация сообщений и анимации
- Быстрые ответы (Quick Replies)
- Landing page
- Адаптивный дизайн
- Firestore rules для безопасности данных
- Деплой на Firebase Hosting

⏳ **В разработке:**
- Интеграция с Claude API (реальный AI вместо mock-данных)
- Режим поиска товаров (подключение к MCP API)
- Firebase Authentication
- История чатов в Firestore
- Персонализация на основе истории пользователя

## 🏗️ Архитектура

```
┌─────────────────────────────────────────┐
│  Frontend: Next.js + React + Tailwind   │
│  Hosting: Firebase Hosting              │
│  URL: https://ai.cvetov.com             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Backend API (будущее):                 │
│  MCP Server: https://mcp.cvetov24.ru    │
│  - Token authentication                 │
│  - Claude AI integration                │
│  - Products search                      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Firestore Database:                    │
│  - users/{userId}                       │
│    ├── chats/{chatId}                   │
│    ├── recipients/{recipientId}         │
│    └── deliveries/{deliveryId}          │
│  - guest_chats/{sessionId}              │
└─────────────────────────────────────────┘
```

## 🛠️ Технологии

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Database:** Cloud Firestore
- **Hosting:** Firebase Hosting
- **Icons:** Lucide React
- **AI (планируется):** Claude 3.5 Sonnet

## 📦 Структура проекта

```
cvetov-ai/
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── chat/page.tsx      # Chat interface
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── chat/              # Chat components
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── typing-indicator.tsx
│   │   │   ├── quick-replies.tsx
│   │   │   ├── params-progress.tsx
│   │   │   └── chat-input.tsx
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── store/             # Zustand stores
│   │   ├── firebase/          # Firebase config
│   │   └── utils.ts
│   └── types/                 # TypeScript types
├── docs/                      # Documentation
├── firestore.rules            # Firestore security rules
├── firebase.json              # Firebase config
└── README.md
```

## 🚀 Локальная разработка

### Требования

- Node.js 20+
- npm или yarn
- Firebase CLI

### Установка

```bash
# Установить зависимости
cd frontend
npm install

# Запустить dev server
npm run dev
```

Откройте http://localhost:3000

### Сборка

```bash
# Production build
npm run build

# Результат в ./out
```

### Деплой на Firebase

```bash
# Из корневой директории
firebase deploy --only hosting
```

## 🎨 Дизайн

Дизайн следует спецификации из `docs/DESIGN_SPEC_AI_Shopping_Assistant.md`:

- **Цвета:** Красный (#DD0B20) - фирменный цвет Цветов.ру
- **Шрифт:** Inter
- **Стиль:** Минималистичный, ChatGPT-like
- **Компоненты:** shadcn/ui inspired

## 🔐 Firestore Rules

Правила безопасности настроены в `firestore.rules`:

- Авторизованные пользователи могут работать только со своими данными
- Гостевые чаты доступны без авторизации
- История чатов и сообщений защищена

## 📝 Два режима работы чата

### 1. Режим консультации (текущий)
AI собирает параметры:
- 👤 **Кому:** получатель букета
- 🎁 **Повод:** для чего заказ
- 📍 **Город:** локация доставки

Progress bar показывает статус заполнения.

### 2. Режим поиска (в разработке)
После сбора всех параметров:
- Запрос к MCP API с параметрами
- Отображение карточек товаров
- Добавление в корзину
- Оформление заказа

## 🔜 Следующие шаги

1. **Интеграция Claude API**
   - Реальный AI вместо mock-ответов
   - Умное ведение диалога
   - Извлечение параметров из текста

2. **MCP Server API**
   - Подключение к https://mcp.cvetov24.ru
   - Token authentication
   - Поиск товаров
   - Создание заказов

3. **Firebase Auth**
   - Авторизация пользователей
   - История чатов
   - Персонализация

4. **История и персонализация**
   - Сохранение предпочтений
   - Напоминания о датах
   - Повторные заказы

## 📄 Лицензия

© Цветов.ру - Все права защищены

## 👥 Команда

- **Разработка:** Claude Code
- **Заказчик:** Цветов.ру
