export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatSession {
  id: string
  mode: 'consultation' | 'search'
  params: {
    recipient: string | null
    occasion: string | null
    preferences?: string | null
    price?: string | null
    city: {
      name: string
      slug: string
    } | null
  }
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface QuickReply {
  label: string
  value: string
}
