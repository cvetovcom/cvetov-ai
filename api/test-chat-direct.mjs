#!/usr/bin/env node

import fetch from 'node-fetch'

async function getAnonymousToken() {
  const response = await fetch('https://site.cvetov24.ru/api/v2/registration/anonym_access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get anonymous token: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.access_token
}

async function testChatWithClaude() {
  const API_URL = 'http://localhost:8000/api/chat'

  console.log('🤖 Testing direct API response...\n')

  // First, get an anonymous token
  console.log('🔑 Getting anonymous token...')
  const token = await getAnonymousToken()
  console.log('✅ Got token\n')

  // Test message that should trigger search_products tool
  const message = 'Найди букеты от 2000 до 4000 рублей для мамы'

  console.log(`📝 Sending message: "${message}"\n`)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        session_id: `test-session-${Date.now()}`,
        city: 'Уфа'
      })
    })

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }

    const result = await response.json()

    console.log('✅ Full API Response:')
    console.log(JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }
  }
}

testChatWithClaude()