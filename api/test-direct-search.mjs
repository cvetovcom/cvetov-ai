#!/usr/bin/env node

import { catalogService } from './dist/services/catalog.service.js'

async function testDirectSearch() {
  console.log('🔍 Testing direct search for Neftekamsk...\n')

  try {
    const result = await catalogService.searchProducts({
      text: 'букет для мамы',
      slug_city: 'neftekamsk',
      page: 1,
      page_size: 5
    })

    console.log('✅ Search successful!')
    console.log(`Total products found: ${result.total_count}`)

    if (result.catalog_items && result.catalog_items.length > 0) {
      console.log('\nProducts found:')
      result.catalog_items.forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.name}`)
        console.log(`   Price: ${item.price.final_price} ₽`)
        console.log(`   Shop: ${item.shop_name}`)
        if (item.description) {
          console.log(`   Description: ${item.description.substring(0, 100)}...`)
        }
      })
    } else {
      console.log('No products in response')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error('Stack:', error.stack)
    }
  }
}

testDirectSearch()