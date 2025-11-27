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

  console.log('🤖 Testing AI chat with Claude for Neftekamsk search...\n')

  // First, get an anonymous token
  console.log('🔑 Getting anonymous token...')
  const token = await getAnonymousToken()
  console.log('✅ Got token\n')

  // Test message that should trigger search_products tool
  const message = 'Найди букет для мамы в Нефтекамске'

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
        user_city: 'Нефтекамск'
      })
    })

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }

    const result = await response.json()

    console.log('✅ Response received!\n')
    console.log('📍 Message from Claude:')
    console.log('---')
    console.log(result.message)
    console.log('---\n')

    if (result.products && result.products.length > 0) {
      console.log(`🌸 Found ${result.products.length} products:`)
      result.products.forEach((product, i) => {
        console.log(`\n${i + 1}. ${product.name}`)
        console.log(`   Price: ${typeof product.price === 'object' ? product.price.final_price || product.price : product.price} ₽`)
        console.log(`   Shop: ${product.shop_name || 'Not specified'}`)
        console.log(`   In stock: ${product.in_stock ? 'Yes' : 'No'}`)
        if (product.image_url) {
          console.log(`   Image: ${product.image_url}`)
        }
      })
    } else {
      console.log('No products in response')
    }

    console.log('\n📦 Cart status:')
    console.log(`   Items: ${result.cart.items_count}`)
    console.log(`   Total: ${result.cart.total_price} ₽`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }
  }
}

testChatWithClaude()