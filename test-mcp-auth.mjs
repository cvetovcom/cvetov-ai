// Тестирование авторизации MCP API
const MCP_BASE_URL = 'https://mcp.cvetov24.ru/api'

async function getAnonymToken() {
  console.log('🔐 Getting anonymous token...')

  try {
    const response = await fetch(`${MCP_BASE_URL}/v2/registration/anonym_access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Got token:', data)
    return data
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return null
  }
}

async function testWithToken(token, endpoint) {
  console.log(`\n📡 Testing: ${endpoint}`)

  try {
    const response = await fetch(`${MCP_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Success:', Object.keys(data))
    return data
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return null
  }
}

async function main() {
  const tokenData = await getAnonymToken()

  if (!tokenData || !tokenData.access_token) {
    console.error('Failed to get token')
    return
  }

  const token = tokenData.access_token
  console.log('\n' + '='.repeat(50))

  // Test with anonym token
  await testWithToken(token, '/v1/cities')
  await testWithToken(token, '/v1/shops?city_slug=moscow')
  await testWithToken(token, '/v2/catalog_items?page=0&page_size=5')
  await testWithToken(token, '/v1/search?q=розы&page=0&page_size=5')
}

main()
