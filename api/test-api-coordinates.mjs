#!/usr/bin/env node

import axios from 'axios'

async function testAPIWithCoordinates() {
  const API_URL = 'https://site.cvetov24.ru/api/v1/search'
  const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE3MjcyNjY4MDAsImV4cCI6MTc1ODgwMjgwMH0.mock-jwt-token-for-testing'

  // Координаты Нефтекамска
  const neftekamskCoords = {
    latitude: 56.0885,
    longitude: 54.2485
  }

  console.log('Testing API with Neftekamsk coordinates...\n')
  console.log(`Coordinates: ${neftekamskCoords.latitude}, ${neftekamskCoords.longitude}\n`)

  try {
    // Test with coordinates
    console.log('Test 1: Searching with latitude/longitude parameters')
    const response1 = await axios.get(API_URL, {
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

    console.log(`Response status: ${response1.status}`)
    console.log(`Total products found: ${response1.data.total_count || 0}`)
    console.log(`Products on this page: ${response1.data.catalog_items?.length || 0}`)

    if (response1.data.catalog_items && response1.data.catalog_items.length > 0) {
      console.log('\n✅ Products found with coordinates!')
      const firstProduct = response1.data.catalog_items[0]
      console.log(`- Name: ${firstProduct.name}`)
      console.log(`- Price: ${firstProduct.price}`)
      console.log(`- Shop: ${firstProduct.shop_name}`)
    } else {
      console.log('\n❌ No products found with these coordinates')
    }

    // Test with slug_city
    console.log('\n---\nTest 2: Searching with slug_city parameter')
    const response2 = await axios.get(API_URL, {
      params: {
        text: 'букет',
        slug_city: 'neftekamsk',
        page: 1,
        page_size: 5
      },
      headers: {
        'Authorization': `Bearer ${JWT}`
      }
    })

    console.log(`Response status: ${response2.status}`)
    console.log(`Total products found: ${response2.data.total_count || 0}`)
    console.log(`Products on this page: ${response2.data.catalog_items?.length || 0}`)

    if (response2.data.catalog_items && response2.data.catalog_items.length > 0) {
      console.log('\n✅ Products found with slug_city!')
      const firstProduct = response2.data.catalog_items[0]
      console.log(`- Name: ${firstProduct.name}`)
      console.log(`- Price: ${firstProduct.price}`)
      console.log(`- Shop: ${firstProduct.shop_name}`)
    } else {
      console.log('\n❌ No products found with slug_city')
    }

    // Compare results
    console.log('\n---\nComparison:')
    console.log(`With coordinates: ${response1.data.total_count || 0} products`)
    console.log(`With slug_city: ${response2.data.total_count || 0} products`)

    if (response1.data.total_count === 0 && response2.data.total_count === 0) {
      console.log('\n⚠️ No products found with either method!')
      console.log('Possible reasons:')
      console.log('1. No shops deliver to Neftekamsk')
      console.log('2. Coordinates are outside all delivery zones')
      console.log('3. JWT token is not valid for production API')
    }

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status)
      console.error('Response:', error.response.data)
    } else {
      console.error('Error:', error.message)
    }
  }
}

testAPIWithCoordinates()