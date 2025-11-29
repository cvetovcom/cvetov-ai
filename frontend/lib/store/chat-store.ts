import { create } from 'zustand'
import { ChatSession, Message } from '@/types'

interface ChatStore {
  session: ChatSession
  isTyping: boolean
  showChat: boolean
  setSession: (session: ChatSession) => void
  addMessage: (message: Message) => void
  updateParams: (params: Partial<ChatSession['params']>) => void
  setIsTyping: (isTyping: boolean) => void
  setShowChat: (showChat: boolean) => void
  resetSession: () => void
}

const createDefaultSession = (): ChatSession => ({
  id: Math.random().toString(36).substring(7),
  mode: 'consultation',
  params: {
    recipient: null,
    occasion: null,
    preferences: null,
    price: null,
    city: null,
  },
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
})

export const useChatStore = create<ChatStore>((set) => ({
  session: createDefaultSession(),
  isTyping: false,
  showChat: false,

  setSession: (session) => set({ session }),

  addMessage: (message) =>
    set((state) => ({
      session: {
        ...state.session,
        messages: [...state.session.messages, message],
        updatedAt: new Date(),
      },
    })),

  updateParams: (params) =>
    set((state) => ({
      session: {
        ...state.session,
        params: { ...state.session.params, ...params },
        updatedAt: new Date(),
      },
    })),

  setIsTyping: (isTyping) => set({ isTyping }),

  setShowChat: (showChat) => set({ showChat }),

  resetSession: () => set({ session: createDefaultSession() }),
}))
