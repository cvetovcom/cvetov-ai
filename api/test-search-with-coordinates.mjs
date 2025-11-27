#!/usr/bin/env node

import axios from 'axios'

async function testSearchWithCoordinates() {
  const API_URL = 'https://site.cvetov24.ru/api/v1/search'
  const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MjcyNjY4MDAsImV4cCI6MTc1ODgwMjgwMH0.mock-jwt-token-for-testing'

  // Координаты Нефтекамска
  const neftekamskCoords = {
    latitude: 56.0885,
    longitude: 54.2485
  }

  console.log('Testing product search with Neftekamsk coordinates...\n')
  console.log(`Coordinates: ${neftekamskCoords.latitude}, ${neftekamskCoords.longitude}\n`)

  try {
    const response = await axios.get(API_URL, {
      params: {
        text: 'букет',
        latitude: neftekamskCoords.latitude,
        longitude: neftekamskCoords.longitude,
        page: 1,
        page_size: 5
      },
      headers: {
        'Authorization': `Bearer ${JWT}`
      }
    })

    console.log(`Total products found: ${response.data.total_count}`)
    console.log(`Products on this page: ${response.data.catalog_items?.length || 0}`)

    if (response.data.catalog_items && response.data.catalog_items.length > 0) {
      console.log('\n✅ Products found! First product:')
      const firstProduct = response.data.catalog_items[0]
      console.log(`- Name: ${firstProduct.name}`)
      console.log(`- Price: ${firstProduct.price}`)
      console.log(`- Shop: ${firstProduct.shop_name}`)
    } else {
      console.log('\n❌ No products found for these coordinates')
      console.log('This might mean no shops deliver to Neftekamsk')
    }
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
    } else {
      console.error('Error:', error.message)
    }
  }
}

testSearchWithCoordinates()