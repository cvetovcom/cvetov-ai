'use client'

import { useState } from 'react'
import { mcpClient } from '@/lib/api/mcp-client'

export default function TestMCPPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCities = async () => {
    setLoading(true)
    try {
      const cities = await mcpClient.getCities()
      setResult({ cities: cities.slice(0, 10) })
    } catch (error) {
      setResult({ error: String(error) })
    }
    setLoading(false)
  }

  const testShops = async () => {
    setLoading(true)
    try {
      const shops = await mcpClient.getShops('moscow')
      setResult({ shops: shops.slice(0, 10) })
    } catch (error) {
      setResult({ error: String(error) })
    }
    setLoading(false)
  }

  const testSearch = async () => {
    setLoading(true)
    try {
      const result = await mcpClient.searchProducts({
        city_slug: 'moscow',
        min_price: 2000,
        max_price: 5000,
        page_size: 10,
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    }
    setLoading(false)
  }

  const testSearchWithPreferences = async () => {
    setLoading(true)
    try {
      const result = await mcpClient.searchProducts({
        city_slug: 'moscow',
        preferences: 'розы',
        page_size: 10,
      })
      setResult(result)
    } catch (error) {
      setResult({ error: String(error) })
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">MCP API Test</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={testCities}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Cities
        </button>
        <button
          onClick={testShops}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Shops (Moscow)
        </button>
        <button
          onClick={testSearch}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Search (2000-5000)
        </button>
        <button
          onClick={testSearchWithPreferences}
          disabled={loading}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
        >
          Test Search (розы)
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {result && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
