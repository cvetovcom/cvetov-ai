#!/usr/bin/env node

import puppeteer from 'puppeteer'

async function captureWebsiteRequests() {
  console.log('Launching browser to capture network requests...\n')

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  })
  const page = await browser.newPage()

  // Enable request interception
  await page.setRequestInterception(true)

  // Capture all API requests
  const apiRequests = []

  page.on('request', request => {
    const url = request.url()

    // Log API requests
    if (url.includes('/api/') || url.includes('latitude') || url.includes('longitude') || url.includes('slug_city')) {
      const params = new URL(url).searchParams
      console.log('\n📡 API Request:')
      console.log('URL:', url)

      if (params.has('latitude') || params.has('longitude') || params.has('slug_city')) {
        console.log('Parameters:')
        if (params.has('latitude')) console.log('  - latitude:', params.get('latitude'))
        if (params.has('longitude')) console.log('  - longitude:', params.get('longitude'))
        if (params.has('slug_city')) console.log('  - slug_city:', params.get('slug_city'))
      }

      apiRequests.push({
        url,
        method: request.method(),
        params: Object.fromEntries(params)
      })
    }

    request.continue()
  })

  // Navigate to Neftekamsk page
  console.log('Navigating to http://localhost:10000/neftekamsk/\n')
  await page.goto('http://localhost:10000/neftekamsk/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  })

  // Wait a bit for all requests to complete
  await page.waitForTimeout(5000)

  console.log('\n\n=== Summary of API Requests ===')
  console.log(`Total API requests captured: ${apiRequests.length}`)

  // Find requests with coordinates or city slug
  const locationRequests = apiRequests.filter(req =>
    req.params.latitude || req.params.longitude || req.params.slug_city
  )

  if (locationRequests.length > 0) {
    console.log('\n🎯 Requests with location parameters:')
    locationRequests.forEach(req => {
      console.log('\n- URL:', req.url)
      if (req.params.latitude) console.log('  latitude:', req.params.latitude)
      if (req.params.longitude) console.log('  longitude:', req.params.longitude)
      if (req.params.slug_city) console.log('  slug_city:', req.params.slug_city)
    })
  } else {
    console.log('\n⚠️ No requests with location parameters found!')
  }

  // Keep browser open for manual inspection
  console.log('\n\n✅ Browser will stay open. Check the Network tab in DevTools for more details.')
  console.log('Press Ctrl+C to close...')

  // Keep the script running
  await new Promise(() => {})
}

captureWebsiteRequests().catch(console.error)