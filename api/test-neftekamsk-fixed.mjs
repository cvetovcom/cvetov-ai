#!/usr/bin/env node

import axios from 'axios'

async function testNeftekamskFixed() {
  const API_URL = 'https://site.cvetov24.ru/api/v1/cities'

  console.log('Testing Neftekamsk availability with page_size=200...\n')

  try {
    // Request all cities with page_size=200
    const response = await axios.get(API_URL, {
      params: {
        page: 0,  // 0-based pagination
        page_size: 200  // Get all cities in one request
      }
    })

    const data = response.data
    console.log(`Total cities: ${data.total}`)
    console.log(`Cities loaded: ${data.cities.length}`)
    console.log(`Page count: ${data.page_count}`)
    console.log('---')

    // Search for Neftekamsk
    const neftekamsk = data.cities.find(city =>
      city.name.toLowerCase().includes('нефтекамск')
    )

    if (neftekamsk) {
      console.log('✅ NEFTEKAMSK FOUND!')
      console.log(JSON.stringify(neftekamsk, null, 2))
      console.log('\n✅ Fix confirmed: Neftekamsk is now accessible!')
    } else {
      console.log('❌ Neftekamsk still not found')

      // Show similar cities for debugging
      const similar = data.cities.filter(city =>
        city.name.toLowerCase().includes('нефте')
      )
      if (similar.length > 0) {
        console.log('Similar cities:', similar.map(c => c.name).join(', '))
      }
    }

    // Also test the local API endpoint
    console.log('\n---\nTesting local API...')
    const localResponse = await axios.post(
      'http://localhost:8000/api/chat',
      {
        message: 'букет маме в нефтекамске',
        city: 'Нефтекамск'
      },
      {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MjcyNjY4MDAsImV4cCI6MTc1ODgwMjgwMH0.mock-jwt-token-for-testing',
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Local API Response:', localResponse.data.message.substring(0, 100) + '...')
    if (localResponse.data.products && localResponse.data.products.length > 0) {
      console.log(`✅ Local API found ${localResponse.data.products.length} products for Neftekamsk!`)
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Local API is not running. Start it with: cd /Users/bulat/cvetov/cvetov-ai/api && npm run dev')
    } else {
      console.error('Error:', error.message)
      if (error.response) {
        console.error('Response:', error.response.data)
      }
    }
  }
}

testNeftekamskFixed()