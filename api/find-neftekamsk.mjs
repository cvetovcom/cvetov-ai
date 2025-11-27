#!/usr/bin/env node

import axios from 'axios'

async function findNeftekamsk() {
  const API_URL = 'https://site.cvetov24.ru/api/v1/cities'
  const pageSize = 50
  const totalPages = 4 // 184 cities / 50 per page = ~4 pages

  console.log('Searching for Neftekamsk in API...\n')

  for (let page = 1; page <= totalPages; page++) {
    try {
      const response = await axios.get(API_URL, {
        params: {
          page: page,
          page_size: pageSize
        }
      })

      const data = response.data
      console.log(`Page ${page}: ${data.cities.length} cities loaded`)

      // Search for Neftekamsk
      const neftekamsk = data.cities.find(city =>
        city.name.toLowerCase().includes('нефтекамск')
      )

      if (neftekamsk) {
        console.log('\n✅ FOUND NEFTEKAMSK!')
        console.log(JSON.stringify(neftekamsk, null, 2))
        return neftekamsk
      }

      // Also show any cities with "нефте" in name
      const similar = data.cities.filter(city =>
        city.name.toLowerCase().includes('нефте')
      )

      if (similar.length > 0) {
        console.log(`  Similar cities:`, similar.map(c => c.name).join(', '))
      }

    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message)
    }
  }

  console.log('\n❌ Neftekamsk not found in API')
  console.log('This city might be missing from the API or have a different name')
}

findNeftekamsk()