#!/usr/bin/env node

import fetch from 'node-fetch'

async function testAIChatWithNeftekamsk() {
  const API_URL = 'http://localhost:8000/api/chat'

  console.log('Testing AI Chat with Neftekamsk location...\n')

  // Test message: "букет маме в нефтекамске"
  const testMessage = 'букет маме в нефтекамске'
  console.log(`Sending message: "${testMessage}"\n`)

  const requestBody = {
    message: testMessage,
    conversationHistory: [],
    tempCart: { items: [] },
    sessionSettings: {
      userCity: 'Нефтекамск'
    }
  }

  try {
    console.log('Making request to AI chat...')
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-jwt-token'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }

    const result = await response.json()
    console.log('✅ Response received successfully!\n')

    // Check if products were found
    if (result.products && result.products.length > 0) {
      console.log(`🎉 Found ${result.products.length} products in Neftekamsk!`)
      console.log('\nFirst 3 products:')
      result.products.slice(0, 3).forEach((product, i) => {
        console.log(`\n${i + 1}. ${product.name}`)
        console.log(`   Price: ${product.price} ₽`)
        console.log(`   Shop: ${product.shop_name}`)
        if (product.description) {
          console.log(`   Description: ${product.description.substring(0, 100)}...`)
        }
      })
    } else {
      console.log('❌ No products found')
      console.log('AI Response:', result.message)
    }

    // Log the AI message
    if (result.message) {
      console.log('\n📝 AI Message:')
      console.log(result.message)
    }

  } catch (error) {
    console.error('Error:', error.message)
    if (error.cause) {
      console.error('Cause:', error.cause)
    }
  }
}

testAIChatWithNeftekamsk()