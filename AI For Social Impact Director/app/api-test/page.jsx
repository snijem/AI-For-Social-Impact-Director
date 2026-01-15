'use client'

import { useState } from 'react'

export default function APITest() {
  const [results, setResults] = useState([])
  const [testing, setTesting] = useState(false)

  const routes = [
    { method: 'GET', path: '/api/health', name: 'Health Check', body: null },
    { method: 'GET', path: '/api/test-db', name: 'Test Database', body: null },
    { method: 'GET', path: '/api/auth', name: 'Auth Check', body: null },
    { method: 'POST', path: '/api/test-db', name: 'Setup Database', body: null },
  ]

  const testRoute = async (route) => {
    try {
      const options = {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (route.body) {
        options.body = JSON.stringify(route.body)
      }

      const response = await fetch(route.path, options)
      const contentType = response.headers.get('content-type')
      const isJSON = contentType && contentType.includes('application/json')

      let data
      let isHTML = false

      if (isJSON) {
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch (e) {
          isHTML = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype')
          data = { error: 'Failed to parse JSON', raw: text.substring(0, 200) }
        }
      } else {
        const text = await response.text()
        isHTML = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')
        data = isHTML 
          ? { error: 'Received HTML error page', preview: text.substring(0, 300) } 
          : { error: 'Invalid content type', contentType, preview: text.substring(0, 200) }
      }

      return {
        ...route,
        status: response.status,
        success: response.ok && isJSON && !isHTML,
        isHTML,
        data,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        ...route,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    }
  }

  const testAll = async () => {
    setTesting(true)
    setResults([])

    const testResults = []
    for (const route of routes) {
      const result = await testRoute(route)
      testResults.push(result)
      setResults([...testResults])
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
    }

    setTesting(false)
  }

  const testSingle = async (route) => {
    setTesting(true)
    const result = await testRoute(route)
    setResults([result])
    setTesting(false)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
        
        <div className="mb-6">
          <button
            onClick={testAll}
            disabled={testing}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test All Routes'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border-2 ${
                  result.success
                    ? 'bg-green-50 border-green-300'
                    : result.isHTML
                    ? 'bg-red-50 border-red-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">
                    {result.method} {result.path}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      result.success
                        ? 'bg-green-200 text-green-800'
                        : result.isHTML
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {result.success ? '✅ OK' : result.isHTML ? '❌ HTML Error' : '⚠️ Warning'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  Status: {result.status || 'N/A'} | {result.name}
                </div>

                {result.isHTML && (
                  <div className="bg-red-100 p-3 rounded mb-3">
                    <p className="text-red-800 font-semibold mb-2">
                      ⚠️ This route returned HTML instead of JSON!
                    </p>
                    <p className="text-sm text-red-700">
                      This usually means there's an error in the API route. Check the server console (where you ran npm run dev) for detailed error messages.
                    </p>
                  </div>
                )}

                {result.error && (
                  <div className="bg-red-100 p-3 rounded mb-3">
                    <p className="text-red-800 font-semibold">Error: {result.error}</p>
                  </div>
                )}

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.data || result, null, 2)}
                  </pre>
                </details>

                <button
                  onClick={() => testSingle(result)}
                  disabled={testing}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                >
                  Test Again
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Quick Test Links:</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a href="/api/health" target="_blank" className="text-blue-600 hover:underline">
                GET /api/health
              </a>
            </li>
            <li>
              <a href="/api/test-db" target="_blank" className="text-blue-600 hover:underline">
                GET /api/test-db
              </a>
            </li>
            <li>
              <a href="/api/auth" target="_blank" className="text-blue-600 hover:underline">
                GET /api/auth
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
