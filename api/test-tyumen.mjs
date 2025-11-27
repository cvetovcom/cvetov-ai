#!/usr/bin/env node

import axios from 'axios'

const API_URL = 'http://localhost:8000/api'
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MjcyNjY4MDAsImV4cCI6MTc1ODgwMjgwMH0.mock-jwt-token-for-testing'

async function testTyumenSearch() {
  console.log('Testing Tyumen city search through AI chat...\n')

  try {
    // Test with a city that exists - Tyumen
    const message = 'букет маме в тюмени'

    console.log('Sending message to AI:', message)
    console.log('---')

    const response = await axios.post(
      `${API_URL}/chat`,
      {
        message: message,
        city: 'Тюмень'
      },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('AI Response:', response.data.message)
    console.log('---')

    if (response.data.products && response.data.products.length > 0) {
      console.log(`Found ${response.data.products.length} products:`)
      response.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.price}₽`)
      })
    } else {
      console.log('No products returned in response')
    }

    console.log('\n✅ Test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed!')
    if (error.response) {
      console.error('Response error:', error.response.data)
      console.error('Status:', error.response.status)
    } else {
      console.error('Error:', error.message)
    }
    process.exit(1)
  }
}

testTyumenSearch()