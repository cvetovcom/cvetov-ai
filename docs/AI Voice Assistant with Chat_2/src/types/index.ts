// ============================================
// ТИПЫ ДЛЯ AI SHOPPING ASSISTANT
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: string[];
  products?: MCPProduct[];
}

export interface QuickReply {
  label: string;
  value: string;
}

export interface ChatSession {
  id: string;
  mode: 'consultation' | 'search';
  params: SessionParams;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionParams {
  recipient: string | null;     // "маме", "девушке", "коллеге"
  occasion: string | null;       // "день рождения", "8 марта"
  city: MCPCity | null;          // { name: "Москва", slug: "moscow" }
  price: string | null;          // "до 5000", "от 2000 до 5000"
  preferences: string | null;    // "розы", "красные цветы"
}

// ============================================
// MCP API ТИПЫ
// ============================================

export interface MCPProduct {
  id: string;
  name: string;
  price: {
    final_price: number;
    original_price?: number;
    discount?: number;
  };
  main_image: string;
  images?: string[];
  parent_category_slug: string;
  shop_public_uuid: string;
  description?: string;
  in_stock?: boolean;
}

export interface MCPCity {
  slug: string;
  name: string;
  region?: string;
}

export interface MCPShop {
  guid: string;
  name: string;
  city_guid: string;
  city_id: string;
  address?: string;
  slug?: string;
}

export interface MCPSearchFilters {
  city_slug?: string;
  preferences?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
}

// ============================================
// КОРЗИНА И ЗАКАЗ
// ============================================

export interface CartItem extends MCPProduct {
  quantity: number;
}

export interface OrderData {
  customer: {
    name: string;
    phone: string;
    address: string;
    comment?: string;
  };
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  payment_method: 'card' | 'cash';
  delivery_time?: string;
}
