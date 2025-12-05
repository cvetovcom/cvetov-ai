import type { Message, SessionParams, MCPProduct } from '@/types';

const FIREBASE_FUNCTION_URL = 'https://europe-west1-cvetov-ai.cloudfunctions.net/chat';

export interface ChatResponse {
  message: string;
  extractedParams?: Partial<SessionParams>;
  products?: MCPProduct[];
  quickReplies?: string[];
}

export async function sendChatMessage(
  messages: Message[],
  params: SessionParams
): Promise<ChatResponse> {
  const response = await fetch(FIREBASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      params: {
        recipient: params.recipient,
        occasion: params.occasion,
        preferences: params.preferences,
        price: params.price,
        city: params.city,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send message');
  }

  const data = await response.json();
  return data;
}
