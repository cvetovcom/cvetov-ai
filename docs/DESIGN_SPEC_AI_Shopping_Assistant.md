# ДИЗАЙН-СПЕЦИФИКАЦИЯ
## AI Shopping Assistant Цветов.ру

**Референс:** ChatGPT Shopping GPT (https://chatgpt.com/g/g-nleealfRT-shopping-gpt)
**Стиль:** Минималистичный, чистый, современный (ChatGPT-like)
**Бренд:** Цветов.ру — красный #DD0B20, белый, чёрный

---

## 1. DESIGN TOKENS

### 1.1 Цветовая палитра

```css
:root {
  /* Primary - Red (фирменный цвет Цветов.ру) */
  --primary-50: #fef2f2;
  --primary-100: #fee2e2;
  --primary-200: #fecaca;
  --primary-300: #fca5a5;
  --primary-400: #f87171;
  --primary-500: #DD0B20;  /* Основной фирменный цвет */
  --primary-600: #c50a1c;
  --primary-700: #a30917;
  --primary-800: #820713;
  --primary-900: #61050e;
  
  /* Neutral - Gray */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;
  
  /* Black & White */
  --white: #ffffff;
  --black: #000000;
  
  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f5;
  --bg-chat: #ffffff;
  --bg-message-user: #f4f4f5;
  --bg-message-ai: #ffffff;
  
  /* Text */
  --text-primary: #18181b;      /* Почти чёрный */
  --text-secondary: #71717a;
  --text-muted: #a1a1aa;
}
```

### 1.2 Типографика

```css
:root {
  /* Font Family */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### 1.3 Spacing & Sizing

```css
:root {
  /* Spacing */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  
  /* Border Radius */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### 1.4 Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DD0B20',  // Фирменный красный Цветов.ру
          600: '#c50a1c',
          700: '#a30917',
          800: '#820713',
          900: '#61050e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
}

export default config
```

---

## 2. СТРАНИЦЫ И ЭКРАНЫ

### 2.1 Landing Page (/)

**Назначение:** Приветственный экран, переход в чат

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🌸 Цветов.ру AI                            [Корзина 0] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                                                              │
│                      🌸                                      │
│                                                              │
│              AI-ассистент Цветов.ру                         │
│                                                              │
│     Помогу подобрать идеальный букет за пару минут          │
│                                                              │
│                                                              │
│              ┌─────────────────────────┐                    │
│              │    Начать подбор 💐     │                    │
│              └─────────────────────────┘                    │
│                                                              │
│                                                              │
│     ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│     │ 🎂        │  │ 💕        │  │ 🙏        │            │
│     │День       │  │Романтика  │  │Извинение  │            │
│     │рождения   │  │           │  │           │            │
│     └───────────┘  └───────────┘  └───────────┘            │
│                                                              │
│                                                              │
│  FOOTER                                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ © Цветов.ру · Политика · Поддержка                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Компоненты:**
- Header (logo + cart button)
- Hero section (icon + title + subtitle)
- CTA button (primary, large)
- Quick occasion cards (3 columns)
- Footer (minimal)

**Стили:**
```tsx
// Hero
<div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
  <div className="text-6xl mb-6">🌸</div>
  <h1 className="text-3xl font-semibold text-gray-900 mb-3">
    AI-ассистент Цветов.ру
  </h1>
  <p className="text-lg text-gray-500 mb-8 max-w-md">
    Помогу подобрать идеальный букет за пару минут
  </p>
  <Button size="lg" className="bg-primary-500 hover:bg-primary-600">
    Начать подбор 💐
  </Button>
</div>

// Occasion Cards
<div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
  {occasions.map(occasion => (
    <button className="p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all">
      <span className="text-2xl">{occasion.emoji}</span>
      <span className="text-sm text-gray-600 mt-2">{occasion.label}</span>
    </button>
  ))}
</div>
```

---

### 2.2 Chat Page (/chat)

**Назначение:** Основной интерфейс чата с AI

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ← 🌸 Цветов.ру AI                          [🛒 2]      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  CHAT AREA (scrollable)                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │  ┌─────────────────────────────────┐                    ││
│  │  │ 🤖 Привет! 🌸 Я помогу          │                    ││
│  │  │ подобрать идеальный букет.      │                    ││
│  │  │ Какой повод?                    │                    ││
│  │  └─────────────────────────────────┘                    ││
│  │                                                          ││
│  │                    ┌─────────────────────────────────┐  ││
│  │                    │ День рождения мамы              │  ││
│  │                    └─────────────────────────────────┘  ││
│  │                                                          ││
│  │  ┌─────────────────────────────────┐                    ││
│  │  │ 🤖 Отлично! Сколько планируешь  │                    ││
│  │  │ потратить?                      │                    ││
│  │  └─────────────────────────────────┘                    ││
│  │                                                          ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                   ││
│  │  │до 2000₽ │ │до 3000₽ │ │до 5000₽ │  Quick replies   ││
│  │  └─────────┘ └─────────┘ └─────────┘                   ││
│  │                                                          ││
│  │  ┌─────────────────────────────────┐                    ││
│  │  │ 🤖 Вот что я подобрал:          │                    ││
│  │  └─────────────────────────────────┘                    ││
│  │                                                          ││
│  │  ┌─────────────────┐ ┌─────────────────┐               ││
│  │  │ [IMAGE]         │ │ [IMAGE]         │               ││
│  │  │ Нежность        │ │ Весенний сад    │  Product     ││
│  │  │ ⭐ 4.8 (124)    │ │ ⭐ 4.9 (89)     │  Cards       ││
│  │  │ 2 500 ₽         │ │ 2 800 ₽         │               ││
│  │  │ [В корзину]     │ │ [В корзину]     │               ││
│  │  └─────────────────┘ └─────────────────┘               ││
│  │                                                          ││
│  │  ● ● ●  Typing indicator                                ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  INPUT BAR (sticky bottom)                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ┌─────────────────────────────────────────────┐ ┌────┐ ││
│  │ │ Напишите сообщение...                       │ │ ➤  │ ││
│  │ └─────────────────────────────────────────────┘ └────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Компоненты:**

#### 2.2.1 Chat Header
```tsx
<header className="sticky top-0 z-50 bg-white border-b border-gray-100">
  <div className="flex items-center justify-between px-4 h-14">
    <div className="flex items-center gap-3">
      <button className="p-2 hover:bg-gray-100 rounded-lg">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xl">🌸</span>
        <span className="font-medium">Цветов.ру AI</span>
      </div>
    </div>
    <CartButton />
  </div>
</header>
```

#### 2.2.2 Message Bubbles
```tsx
// AI Message (left-aligned)
<div className="flex gap-3 animate-slide-up">
  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
    <span className="text-sm">🤖</span>
  </div>
  <div className="max-w-[80%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
    <p className="text-gray-800 text-[15px] leading-relaxed">
      {message.content}
    </p>
  </div>
</div>

// User Message (right-aligned)
<div className="flex justify-end animate-slide-up">
  <div className="max-w-[80%] bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-3">
    <p className="text-gray-800 text-[15px] leading-relaxed">
      {message.content}
    </p>
  </div>
</div>
```

#### 2.2.3 Quick Replies
```tsx
<div className="flex flex-wrap gap-2 px-4 py-2">
  {replies.map(reply => (
    <button 
      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-all"
    >
      {reply}
    </button>
  ))}
</div>
```

#### 2.2.4 Product Card (в чате)
```tsx
<div className="grid grid-cols-2 gap-3 px-4">
  {products.map(product => (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square relative bg-gray-50">
        <Image src={product.image} fill className="object-cover" />
        {product.available && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            В наличии
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600">
            {product.rating} ({product.reviewCount})
          </span>
        </div>
        
        {/* Price */}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-primary-500">
            {product.price.toLocaleString()} ₽
          </span>
        </div>
        
        {/* Add to Cart */}
        <button className="w-full mt-2 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors">
          В корзину
        </button>
      </div>
    </div>
  ))}
</div>
```

#### 2.2.5 Typing Indicator
```tsx
<div className="flex gap-3 px-4">
  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
    <span className="text-sm">🤖</span>
  </div>
  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
    </div>
  </div>
</div>
```

#### 2.2.6 Chat Input
```tsx
<div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
  <div className="flex items-center gap-2 max-w-3xl mx-auto">
    <div className="flex-1 relative">
      <input
        type="text"
        placeholder="Напишите сообщение..."
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
      />
    </div>
    <button 
      className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors disabled:opacity-50"
      disabled={!hasInput}
    >
      <Send className="w-5 h-5" />
    </button>
  </div>
</div>
```

---

### 2.3 Shopping Cart (Sidebar)

**Назначение:** Боковая панель корзины (slide-in справа)

```
                              ┌─────────────────────────────┐
                              │  CART SIDEBAR               │
                              │  ┌─────────────────────────┐│
                              │  │ Корзина (2)          ✕ ││
                              │  └─────────────────────────┘│
                              │                             │
                              │  ┌─────────────────────────┐│
                              │  │ [IMG] Нежность          ││
                              │  │       2 500 ₽           ││
                              │  │       [-] 1 [+]    🗑   ││
                              │  └─────────────────────────┘│
                              │                             │
                              │  ┌─────────────────────────┐│
                              │  │ [IMG] Весенний сад      ││
                              │  │       2 800 ₽           ││
                              │  │       [-] 1 [+]    🗑   ││
                              │  └─────────────────────────┘│
                              │                             │
                              │  ─────────────────────────  │
                              │                             │
                              │  Итого:           5 300 ₽  │
                              │                             │
                              │  ┌─────────────────────────┐│
                              │  │     Оформить заказ      ││
                              │  └─────────────────────────┘│
                              │                             │
                              │  Очистить корзину          │
                              └─────────────────────────────┘
```

**Компонент:**
```tsx
// components/cart/shopping-cart.tsx
<Sheet open={isOpen} onOpenChange={closeCart}>
  <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        Корзина ({itemCount})
      </h2>
      <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-lg">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Items */}
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {items.map(item => (
        <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
          <div className="w-20 h-20 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image src={item.product.image} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1">{item.product.name}</h4>
            <p className="text-primary-500 font-semibold mt-1">
              {item.product.price.toLocaleString()} ₽
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button className="w-7 h-7 flex items-center justify-center border rounded-md hover:bg-gray-100">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button className="w-7 h-7 flex items-center justify-center border rounded-md hover:bg-gray-100">
                <Plus className="w-3 h-3" />
              </button>
              <button className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Footer */}
    <div className="border-t px-6 py-4 space-y-4">
      <div className="flex justify-between text-lg">
        <span className="text-gray-600">Итого:</span>
        <span className="font-bold text-primary-500">{total.toLocaleString()} ₽</span>
      </div>
      <Button className="w-full bg-primary-500 hover:bg-primary-600 h-12 text-base">
        Оформить заказ
      </Button>
      <button className="w-full text-sm text-gray-500 hover:text-gray-700">
        Очистить корзину
      </button>
    </div>
  </SheetContent>
</Sheet>
```

---

### 2.4 Cart Button (Header)

```tsx
<button 
  onClick={openCart}
  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
>
  <ShoppingCart className="w-5 h-5 text-gray-700" />
  {itemCount > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
      {itemCount}
    </span>
  )}
</button>
```

---

### 2.5 Empty States

#### Пустая корзина
```tsx
<div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <ShoppingCart className="w-10 h-10 text-gray-400" />
  </div>
  <h3 className="font-medium text-gray-900 mb-1">Корзина пуста</h3>
  <p className="text-sm text-gray-500 mb-4">
    Добавьте букеты из чата с AI-ассистентом
  </p>
  <Button onClick={closeCart} variant="outline">
    Вернуться к чату
  </Button>
</div>
```

#### Ошибка загрузки
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
    <AlertCircle className="w-8 h-8 text-red-500" />
  </div>
  <h3 className="font-medium text-gray-900 mb-1">Что-то пошло не так</h3>
  <p className="text-sm text-gray-500 mb-4">
    Попробуйте обновить страницу
  </p>
  <Button onClick={retry}>Попробовать снова</Button>
</div>
```

---

## 3. КОМПОНЕНТЫ UI

### 3.1 Button

```tsx
// Variants
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Primary (red - фирменный цвет)
<Button className="bg-primary-500 hover:bg-primary-600 text-white">
  Primary Action
</Button>
```

**Tailwind классы:**
```css
/* Base */
.btn-base: inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none

/* Primary */
.btn-primary: bg-primary-500 hover:bg-primary-600 text-white

/* Outline */
.btn-outline: border border-gray-200 bg-white hover:bg-gray-50 text-gray-700

/* Ghost */
.btn-ghost: hover:bg-gray-100 text-gray-700

/* Sizes */
.btn-sm: h-8 px-3 text-sm
.btn-default: h-10 px-4 text-sm
.btn-lg: h-12 px-6 text-base
```

### 3.2 Input

```tsx
<input
  type="text"
  placeholder="Placeholder..."
  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
/>
```

### 3.3 Card

```tsx
<div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
  {/* Content */}
</div>
```

### 3.4 Badge

```tsx
// Success
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  В наличии
</span>

// Neutral
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
  2 товара
</span>

// Primary
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
  Популярное
</span>
```

---

## 4. ИКОНКИ

Использовать **Lucide React** (https://lucide.dev)

```tsx
import {
  ArrowLeft,
  Send,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Star,
  MapPin,
  Truck,
  Store,
  X,
  AlertCircle,
  Check,
  ChevronRight,
} from 'lucide-react'
```

**Размеры:**
- Small: `w-4 h-4`
- Default: `w-5 h-5`
- Large: `w-6 h-6`

---

## 5. АНИМАЦИИ

### 5.1 Message появление
```tsx
<div className="animate-slide-up">
  {/* Message content */}
</div>

// Keyframes
@keyframes slideUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

### 5.2 Typing dots
```tsx
<div className="flex gap-1">
  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
</div>
```

### 5.3 Cart sidebar
```tsx
// Sheet component from shadcn/ui handles this
// Slide in from right: 300ms ease-out
```

### 5.4 Add to cart
```tsx
// Button press feedback
<button className="active:scale-95 transition-transform">
  В корзину
</button>

// Success toast
import { toast } from 'sonner'
toast.success('Добавлено в корзину')
```

---

## 6. RESPONSIVE BREAKPOINTS

```css
/* Mobile first */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
```

### Mobile (< 640px)
- Full-width chat
- 2-column product grid
- Bottom input bar
- Sheet cart (full width)

### Tablet (640px - 1024px)
- Centered chat (max-w-2xl)
- 2-column product grid
- Side cart sheet (max-w-md)

### Desktop (> 1024px)
- Centered chat (max-w-3xl)
- 3-column product grid (optional)
- Side cart sheet (max-w-md)

---

## 7. ACCESSIBILITY

- Color contrast ratio ≥ 4.5:1
- Focus visible indicators (ring)
- Keyboard navigation
- ARIA labels on buttons
- Alt text on images
- Touch targets ≥ 44x44px

---

## 8. QUICK COPY-PASTE ДЛЯ CLAUDE CODE

### Фирменные цвета Цветов.ру
```
Красный: #DD0B20 (primary-500)
Белый: #FFFFFF
Чёрный: #000000 / #18181b (text)
```

### Основные цвета Tailwind
```
Primary: bg-primary-500, text-primary-500, border-primary-500
Hover: hover:bg-primary-600
Light: bg-primary-50, bg-primary-100
```

### Частые классы
```
Rounded: rounded-xl, rounded-2xl, rounded-full
Shadow: shadow-sm, shadow-md
Border: border border-gray-100, border border-gray-200
Text: text-gray-900, text-gray-600, text-gray-500
Background: bg-white, bg-gray-50, bg-gray-100
```

### Layout чата
```
Chat container: flex flex-col h-screen
Header: sticky top-0 z-50 bg-white border-b
Messages: flex-1 overflow-y-auto p-4 space-y-4
Input: sticky bottom-0 bg-white border-t p-4
```

---

## 9. ПРИМЕРЫ ПРОМПТОВ ДЛЯ v0.dev

### Chat Interface
```
Create a ChatGPT-style chat interface for a flower delivery AI assistant.

- Red accent color (#DD0B20) - brand color
- White background, clean minimal design
- AI messages: left-aligned with robot avatar, white bubble with border
- User messages: right-aligned, gray bubble
- Typing indicator with bouncing dots
- Sticky input bar at bottom with send button
- Product cards grid (2 columns) with image, name, price, rating, add to cart button

Use shadcn/ui, Tailwind CSS, Lucide icons.
```

### Product Card
```
Create a product card for flower bouquet e-commerce.

- Vertical card with aspect-square image
- Rounded corners (12px)
- Soft shadow on hover
- "В наличии" badge (green, top-right)
- Product name (1 line, truncate)
- Star rating with review count
- Price in rubles (red color #DD0B20, bold)
- Full-width "В корзину" button (red #DD0B20)

Use Tailwind CSS, mobile-optimized.
```

### Cart Sidebar
```
Create a slide-in shopping cart sidebar for a flower delivery e-commerce.

Requirements:
- Slide-in panel from right side
- Close button (X)
- List of cart items with:
  - Small product image
  - Product name
  - Price in rubles
  - Quantity controls (+/-)
  - Remove button
- Order summary at bottom
- Total price
- "Checkout" button (red color #DD0B20)
- Empty state with illustration

Use shadcn/ui Sheet component and Tailwind CSS.
```

---

**КОНЕЦ ДИЗАЙН-СПЕЦИФИКАЦИИ**

Передать этот файл в Claude Code вместе с ТЗ для реализации.
