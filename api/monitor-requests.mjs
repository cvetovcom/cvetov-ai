#!/usr/bin/env node

import http from 'http'
import httpProxy from 'http-proxy'

// Create a proxy server
const proxy = httpProxy.createProxyServer({})

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  // Log all requests with location parameters
  if (url.searchParams.has('latitude') || url.searchParams.has('longitude') || url.searchParams.has('slug_city')) {
    console.log('\n📍 Location Request:')
    console.log('URL:', req.url)

    if (url.searchParams.has('latitude')) {
      console.log('  latitude:', url.searchParams.get('latitude'))
    }
    if (url.searchParams.has('longitude')) {
      console.log('  longitude:', url.searchParams.get('longitude'))
    }
    if (url.searchParams.has('slug_city')) {
      console.log('  slug_city:', url.searchParams.get('slug_city'))
    }
  }

  // Forward to actual server
  proxy.web(req, res, {
    target: 'http://localhost:10000',
    changeOrigin: true
  })
})

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err)
  res.writeHead(500, { 'Content-Type': 'text/plain' })
  res.end('Proxy error')
})

server.listen(10001, () => {
  console.log('Monitoring proxy running on http://localhost:10001')
  console.log('Open http://localhost:10001/neftekamsk/ to monitor requests')
  console.log('\n📊 Monitoring for location-based API requests...\n')
})