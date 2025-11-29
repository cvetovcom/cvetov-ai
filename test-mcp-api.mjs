// Тестирование MCP API клиента
const MCP_BASE_URL = 'https://mcp.cvetov24.ru'  // БЕЗ /api - он будет в путях
const MCP_TOKEN = 'mcp_IRuYYJjDRzoeA-Lt8ivOxAcDNux5V2wA'

async function request(endpoint) {
  const url = `${MCP_BASE_URL}${endpoint}`
  console.log(`\n📡 Testing: ${endpoint}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 sec timeout

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${MCP_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ Error: Request timeout (>10 sec)`)
    } else {
      console.error(`❌ Error: ${error.message}`)
    }
    return null
  }
}

async function testAllEndpoints() {
  console.log('🚀 Starting MCP API Tests\n')
  console.log('=' .repeat(50))

  // Test 1: Cities
  console.log('\n1️⃣ TEST: Get Cities')
  const citiesData = await request('/api/v1/cities')
  if (citiesData && Array.isArray(citiesData)) {
    console.log(`✅ Success: Found ${citiesData.length} cities`)
    console.log(`   Example: ${citiesData[0].name} (${citiesData[0].slug})`)
  }

  // Test 2: Shops in Moscow
  console.log('\n2️⃣ TEST: Get Shops in Moscow')
  const shopsData = await request('/api/v1/shops?city_slug=moscow')
  if (shopsData && Array.isArray(shopsData)) {
    console.log(`✅ Success: Found ${shopsData.length} shops in Moscow`)
    console.log(`   Example: ${shopsData[0].name}`)
  }

  // Test 3: Catalog Items
  console.log('\n3️⃣ TEST: Get Catalog Items')
  const catalogData = await request('/api/v2/catalog_items?page=0&page_size=5')
  if (catalogData && catalogData.catalog_items) {
    console.log(`✅ Success: Found ${catalogData.catalog_items_count || catalogData.total_count} total items (showing ${catalogData.catalog_items.length})`)
    if (catalogData.catalog_items[0]) {
      const item = catalogData.catalog_items[0]
      console.log(`   Example: ${item.name} - ${item.price.final_price}₽`)
    }
  }

  // Test 4: Search (с правильными параметрами)
  console.log('\n4️⃣ TEST: Search for "розы" in Moscow')
  const searchData = await request('/api/v1/search?text=' + encodeURIComponent('розы') + '&slug_city=moscow&page=0&page_size=5')
  if (searchData && searchData.items) {
    console.log(`✅ Success: Found ${searchData.items.length} items`)
    if (searchData.items[0]) {
      console.log(`   Example: ${searchData.items[0].name}`)
    }
  } else if (searchData) {
    console.log(`✅ Response structure:`, Object.keys(searchData))
  }

  console.log('\n' + '='.repeat(50))
  console.log('✨ Tests completed!\n')
}

testAllEndpoints()
