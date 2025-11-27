/**
 * Chat Store
 * Zustand store for managing chat state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: string
  guid?: string // GUID from backend API
  name: string
  price: number
  old_price?: number
  image_url: string
  description?: string
  in_stock: boolean
  shop_name?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  products?: Product[]
}

export interface CartInfo {
  items_count: number
  total_price: number
}

export interface CustomerInfo {
  name?: string
  phone?: string
  email?: string
  address?: string
  delivery_date?: string
  card_text?: string
}

interface ChatState {
  messages: Message[]
  sessionId: string | null
  cart: CartInfo
  isLoading: boolean
  error: string | null
  userCity: string | null
  userLocation: { latitude: number; longitude: number } | null
  customerInfo: CustomerInfo
}

interface ChatActions {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setSessionId: (sessionId: string) => void
  setCart: (cart: CartInfo) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setUserCity: (city: string) => void
  setUserLocation: (location: { latitude: number; longitude: number }) => void
  setCustomerInfo: (info: Partial<CustomerInfo>) => void
  clearChat: () => void
}

type ChatStore = ChatState & ChatActions

const initialState: ChatState = {
  messages: [],
  sessionId: null,
  cart: { items_count: 0, total_price: 0 },
  isLoading: false,
  error: null,
  userCity: null,
  userLocation: null,
  customerInfo: {},
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: Math.random().toString(36).substring(7),
              timestamp: new Date(),
            },
          ],
        })),

      setSessionId: (sessionId) => set({ sessionId }),

      setCart: (cart) => set({ cart }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

  setUserCity: (city) => set({ userCity: city }),

  setUserLocation: (location) => set({ userLocation: location }),

  setCustomerInfo: (info) =>
    set((state) => ({
      customerInfo: { ...state.customerInfo, ...info }
    })),

      clearChat: () => set(initialState),
    }),
    {
      name: 'chat-store', // unique name for localStorage key
      partialize: (state) => ({
        sessionId: state.sessionId,
        userCity: state.userCity,
        userLocation: state.userLocation,
        customerInfo: state.customerInfo,
        messages: state.messages,
        cart: state.cart,
      }),
    }
  )
)
