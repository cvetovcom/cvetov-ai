export interface MCPCity {
  slug: string
  name: string
  region?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  products?: MCPProduct[]
  quickReplies?: string[]
}

export interface MCPProduct {
  guid: string
  name: string
  price: {
    final_price: number
    original_price?: number
    discount?: number
  }
  main_image: string
  images?: string[]
  parent_category_slug: string
  shop_public_uuid: string
  shop_name?: string
  description?: string
  rating?: number
  in_stock?: boolean
  slug?: string
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
    delivery_address?: string | null
    delivery_date?: string | null
    delivery_time?: string | null
    address_question_shown?: boolean
  }
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface QuickReply {
  label: string
  value: string
}

export interface CartItem extends MCPProduct {
  quantity: number
}

export interface OrderData {
  customer: {
    name: string
    phone: string
    address: string
    comment?: string
  }
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    price: number
  }>
  total: number
  payment_method?: 'card' | 'cash'
  delivery_date?: string
  delivery_time?: string
}

export type SessionParams = ChatSession['params']
