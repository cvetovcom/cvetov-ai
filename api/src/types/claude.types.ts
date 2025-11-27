/**
 * Claude Service Types
 * TypeScript definitions for Claude AI integration
 */

import type { TempCart } from './cart.types.js'

export interface ClaudeResponse {
  message: string
  products?: any[]
  tempCart: TempCart
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  customerInfo?: any
  updatedCity?: string
}

export interface ProductSearchRequest {
  query: string
  city?: string
  page?: number
  page_size?: number
}

export interface ToolResult {
  data: any
  isError?: boolean
  updatedCart?: TempCart
  customerInfo?: any
  cityToSet?: string
  tool_use_id?: string
  content?: any
}