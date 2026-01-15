/**
 * API Connection Checker
 * Tests all API routes to verify they're working correctly
 */

const API_BASE = 'http://localhost:3000'

const routes = [
  { method: 'GET', path: '/api/test-db', name: 'Test Database Connection' },
  { method: 'GET', path: '/api/auth', name: 'Auth Check' },
  { method: 'POST', path: '/api/signup', name: 'Signup (test)', body: { fullName: 'Test User', email: 'test@test.com', phone: '1234567890', password: 'testpassword123' } },
  { method: 'GET', path: '/api/videos', name: 'Get Videos' },
]

async function testRoute(route) {
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

    const response = await fetch(`${API_BASE}${route.path}`, options)
    const contentType = response.headers.get('content-type')
    const isJSON = contentType && contentType.includes('application/json')

    let data
    let isHTML = false

    if (isJSON) {
      data = await response.json()
    } else {
      const text = await response.text()
      isHTML = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')
      data = isHTML ? { error: 'Received HTML instead of JSON', preview: text.substring(0, 200) } : { error: 'Invalid response', text: text.substring(0, 200) }
    }

    return {
      route: route.name,
      path: route.path,
      method: route.method,
      status: response.status,
      success: response.ok && isJSON && !isHTML,
      isHTML,
      data: isHTML ? data : (typeof data === 'object' ? JSON.stringify(data, null, 2).substring(0, 300) : data),
    }
  } catch (error) {
    return {
      route: route.name,
      path: route.path,
      method: route.method,
      success: false,
      error: error.message,
    }
  }
}

async function checkAllRoutes() {
  console.log('🔍 Checking API Routes...\n')
  console.log(`Base URL: ${API_BASE}\n`)

  const results = []

  for (const route of routes) {
    console.log(`Testing ${route.method} ${route.path}...`)
    const result = await testRoute(route)
    results.push(result)

    if (result.success) {
      console.log(`✅ ${route.name}: OK (Status: ${result.status})`)
    } else if (result.isHTML) {
      console.log(`❌ ${route.name}: FAILED - Returned HTML instead of JSON`)
      console.log(`   Status: ${result.status}`)
    } else if (result.error) {
      console.log(`❌ ${route.name}: ERROR - ${result.error}`)
    } else {
      console.log(`⚠️  ${route.name}: Status ${result.status}`)
    }
    console.log('')
  }

  console.log('\n📊 Summary:')
  console.log('='.repeat(50))
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('='.repeat(50))

  if (failed > 0) {
    console.log('\n❌ Failed Routes:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`\n${r.method} ${r.path}`)
      if (r.isHTML) {
        console.log('  → Returns HTML error page (check server console)')
      } else if (r.error) {
        console.log(`  → Error: ${r.error}`)
      } else {
        console.log(`  → Status: ${r.status}`)
      }
    })
  }
}

// Run if executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const http = require('http')
  
  console.log('⚠️  This script needs to run in a browser environment.')
  console.log('Please open the browser console and run the check-api-connections.js file')
  console.log('Or visit: http://localhost:3000/api/test-db to test manually')
} else {
  // Browser environment
  checkAllRoutes().catch(console.error)
}
