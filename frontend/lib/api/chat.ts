import { Message, ChatSession } from '@/types'

const CLOUD_FUNCTION_URL =
  process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL ||
  'https://europe-west1-cvetov-ai.cloudfunctions.net/chat'

interface ChatResponse {
  message: string
  extractedParams?: {
    recipient?: string
    occasion?: string
    city?: {
      name: string
      slug: string
    }
  }
}

export async function sendChatMessage(
  messages: Message[],
  params: ChatSession['params']
): Promise<ChatResponse> {
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        params,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error sending chat message:', error)
    throw error
  }
}
