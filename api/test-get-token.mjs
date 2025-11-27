#!/usr/bin/env node

import fetch from 'node-fetch'

async function getAnonymousToken() {
  const API_URL = 'https://site.cvetov24.ru/api/v2/registration/anonym_access_token'

  console.log('🔐 Getting anonymous access token from API...\n')

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return null
    }

    const result = await response.json()
    console.log('✅ Successfully obtained anonymous token!\n')

    if (result.access_token) {
      console.log('Token details:')
      console.log('- User ID (sub):', result.access_token.sub)
      console.log('- Token ID (jti):', result.access_token.jti)
      console.log('- Roles:', result.access_token.roles)
      console.log('- Audience:', result.access_token.aud)
      console.log('- Issued at:', new Date(result.access_token.iat * 1000).toISOString())
      console.log('- Expires at:', new Date(result.access_token.exp * 1000).toISOString())

      // Calculate token lifetime
      const lifetimeMinutes = (result.access_token.exp - result.access_token.iat) / 60
      console.log(`- Lifetime: ${lifetimeMinutes} minutes`)

      // Construct the JWT token string (the API returns the decoded payload)
      // For testing, we'll need to use this token in Bearer auth
      console.log('\n📝 Use this token in Authorization header:')
      console.log(`Bearer ${JSON.stringify(result.access_token)}`)

      return result.access_token
    }

    console.error('❌ No access token in response')
    return null

  } catch (error) {
    console.error('❌ Error getting token:', error.message)
    if (error.cause) {
      console.error('Cause:', error.cause)
    }
    return null
  }
}

// Test search with the token
async function testSearchWithToken(token) {
  if (!token) {
    console.log('\n⚠️  No token available, skipping search test')
    return
  }

  console.log('\n🔍 Testing search with anonymous token...\n')

  const searchUrl = 'https://site.cvetov24.ru/api/v1/search'
  const params = new URLSearchParams({
    text: 'букет для мамы',
    slug_city: 'neftekamsk',
    page: '1',
    page_size: '10'
  })

  try {
    // Note: The token object needs to be encoded as a proper JWT
    // The API might expect the full JWT string, not just the payload
    const response = await fetch(`${searchUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JSON.stringify(token)}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)

      // Try with the token sub as a simple string
      console.log('\n🔄 Retrying with sub as token...')
      const retryResponse = await fetch(`${searchUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.sub}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`Retry status: ${retryResponse.status} ${retryResponse.statusText}`)

      if (!retryResponse.ok) {
        console.error('❌ Search still failed with token')
        console.log('\n💡 Note: The API returns the decoded JWT payload, but we need the actual encoded JWT string.')
        console.log('The anonymous endpoint might not return the full JWT token that can be used directly.')
      } else {
        const result = await retryResponse.json()
        console.log('✅ Search successful with token.sub!')
        console.log(`Found ${result.total_count} products`)
      }
      return
    }

    const result = await response.json()
    console.log('✅ Search successful!')
    console.log(`Found ${result.total_count} products in Neftekamsk`)

    if (result.catalog_items && result.catalog_items.length > 0) {
      console.log('\nFirst 3 products:')
      result.catalog_items.slice(0, 3).forEach((item, i) => {
        console.log(`${i + 1}. ${item.name} - ${item.price} ₽`)
      })
    }

  } catch (error) {
    console.error('❌ Search error:', error.message)
  }
}

// Main execution
async function main() {
  const token = await getAnonymousToken()
  await testSearchWithToken(token)
}

main()