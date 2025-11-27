#!/usr/bin/env node

import axios from 'axios'

async function testNeftekamskConversion() {
  const API_URL = 'http://localhost:8000/api/chat'
  const JWT = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MjcyNjY4MDAsImV4cCI6MTc1ODgwMjgwMH0.mock-jwt-token-for-testing'

  console.log('Testing Neftekamsk with automatic city name to slug conversion...\n')

  try {
    // Test 1: Send message with Cyrillic city name
    console.log('Test 1: Sending with Cyrillic city name "Нефтекамск"')
    const response1 = await axios.post(
      API_URL,
      {
        message: 'букет маме в нефтекамске',
        city: 'Нефтекамск' // Cyrillic name
      },
      {
        headers: {
          'Authorization': JWT,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Response message:', response1.data.message.substring(0, 200) + '...')
    if (response1.data.products && response1.data.products.length > 0) {
      console.log(`✅ Found ${response1.data.products.length} products!`)
      console.log('First product:', response1.data.products[0].name)
    } else {
      console.log('❌ No products found')
    }
    console.log('---\n')

    // Test 2: Send message without city (should use session)
    console.log('Test 2: Using session from previous request')
    const response2 = await axios.post(
      API_URL,
      {
        message: 'розы для бабушки',
        session_id: response1.data.session_id
      },
      {
        headers: {
          'Authorization': JWT,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Response message:', response2.data.message.substring(0, 200) + '...')
    if (response2.data.products && response2.data.products.length > 0) {
      console.log(`✅ Found ${response2.data.products.length} products using session!`)
      console.log('First product:', response2.data.products[0].name)
    } else {
      console.log('❌ No products found')
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running. Start it with: cd /Users/bulat/cvetov/cvetov-ai/api && npm run dev')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
}

testNeftekamskConversion()