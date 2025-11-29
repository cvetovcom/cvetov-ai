import { create } from 'zustand';
import type { 
  ChatSession, 
  Message, 
  QuickReply, 
  SessionParams, 
  MCPProduct, 
  CartItem,
  MCPCity 
} from '@/types';

interface ChatStore {
  // Текущая сессия
  session: ChatSession;
  
  // UI состояния
  isLoading: boolean;
  quickReplies: QuickReply[];
  
  // Корзина
  cart: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  
  // Методы сессии
  addMessage: (content: string, role: 'user' | 'assistant', options?: { quickReplies?: string[]; products?: MCPProduct[] }) => void;
  updateParam: (key: keyof SessionParams, value: any) => void;
  switchMode: (mode: 'consultation' | 'search') => void;
  resetSession: () => void;
  setLoading: (loading: boolean) => void;
  setQuickReplies: (replies: QuickReply[]) => void;
  
  // Методы корзины
  addToCart: (product: MCPProduct) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  setCartOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
}

const createInitialSession = (): ChatSession => ({
  id: Date.now().toString(),
  mode: 'consultation',
  params: {
    recipient: null,
    occasion: null,
    city: null,
    price: null,
    preferences: null,
  },
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useChatStore = create<ChatStore>((set, get) => ({
  // Начальное состояние
  session: createInitialSession(),
  isLoading: false,
  quickReplies: [],
  cart: [],
  isCartOpen: false,
  isCheckoutOpen: false,

  // Добавить сообщение
  addMessage: (content, role, options = {}) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      quickReplies: options.quickReplies,
      products: options.products,
    };

    set((state) => ({
      session: {
        ...state.session,
        messages: [...state.session.messages, newMessage],
        updatedAt: new Date(),
      },
    }));
  },

  // Обновить параметр
  updateParam: (key, value) => {
    set((state) => ({
      session: {
        ...state.session,
        params: {
          ...state.session.params,
          [key]: value,
        },
        updatedAt: new Date(),
      },
    }));
  },

  // Переключить режим
  switchMode: (mode) => {
    set((state) => ({
      session: {
        ...state.session,
        mode,
        updatedAt: new Date(),
      },
    }));
  },

  // Сбросить сессию
  resetSession: () => {
    set({
      session: createInitialSession(),
      quickReplies: [],
      isLoading: false,
    });
  },

  // Установить загрузку
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Установить быстрые ответы
  setQuickReplies: (replies) => {
    set({ quickReplies: replies });
  },

  // Добавить в корзину
  addToCart: (product) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.id === product.id);
      
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      
      return {
        cart: [...state.cart, { ...product, quantity: 1 }],
      };
    });
  },

  // Удалить из корзины
  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },

  // Обновить количество
  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  // Очистить корзину
  clearCart: () => {
    set({ cart: [] });
  },

  // Получить общую сумму
  getTotalPrice: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + item.price.final_price * item.quantity, 0);
  },

  // Открыть/закрыть корзину
  setCartOpen: (open) => {
    set({ isCartOpen: open });
  },

  // Открыть/закрыть оформление
  setCheckoutOpen: (open) => {
    set({ isCheckoutOpen: open });
  },
}));
