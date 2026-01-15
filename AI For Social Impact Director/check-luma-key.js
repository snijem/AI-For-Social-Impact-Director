/**
 * Quick script to check if LUMA_API_KEY is configured
 * Run with: node check-luma-key.js
 */

require('dotenv').config({ path: '.env.local' })

const lumaApiKey = process.env.LUMA_API_KEY

console.log('\n🔍 Checking Luma API Key Configuration...\n')
console.log('='.repeat(50))

if (!lumaApiKey) {
  console.log('❌ LUMA_API_KEY is NOT set in .env.local')
  console.log('\n📝 To fix:')
  console.log('1. Create or edit .env.local in the project root')
  console.log('2. Add: LUMA_API_KEY="your-api-key-here"')
  console.log('3. Restart your dev server: npm run dev')
} else {
  console.log('✅ LUMA_API_KEY is set')
  console.log(`   Length: ${lumaApiKey.length} characters`)
  console.log(`   Starts with: ${lumaApiKey.substring(0, 5)}...`)
  
  // Check format
  if (lumaApiKey.startsWith('luma-')) {
    console.log('✅ Key format looks correct (starts with "luma-")')
  } else {
    console.log('⚠️  Key format might be incorrect (should start with "luma-")')
  }
  
  // Check for common issues
  if (lumaApiKey.includes(' ')) {
    console.log('⚠️  Warning: Key contains spaces (might cause issues)')
  }
  
  if (lumaApiKey.length < 20) {
    console.log('⚠️  Warning: Key seems too short')
  }
}

console.log('\n' + '='.repeat(50))
console.log('\n💡 Remember: After updating .env.local, restart your dev server!')
console.log('   Run: npm run dev\n')
