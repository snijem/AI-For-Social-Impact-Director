// Quick script to verify .env.local is readable
const fs = require('fs');
const path = require('path');

console.log('=== Environment File Check ===\n');

const envPath = path.join(__dirname, '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file exists');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env.local is readable');
    console.log('\nFile contents:');
    console.log(content);
    console.log('\n---');
    
    const hasLuma = content.includes('LUMA_API_KEY');
    const hasOpenAI = content.includes('OPENAI_API_KEY');
    
    console.log(`LUMA_API_KEY found: ${hasLuma ? '✅' : '❌'}`);
    console.log(`OPENAI_API_KEY found: ${hasOpenAI ? '✅' : '❌'}`);
    
    if (hasLuma) {
      const lumaMatch = content.match(/LUMA_API_KEY\s*=\s*(.+)/);
      if (lumaMatch) {
        const keyValue = lumaMatch[1].trim().replace(/^["']|["']$/g, '');
        console.log(`LUMA_API_KEY value: ${keyValue.substring(0, 20)}...`);
        console.log(`Key length: ${keyValue.length}`);
      }
    }
  } else {
    console.log('❌ .env.local file does NOT exist');
    console.log(`Expected location: ${envPath}`);
  }
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
}

console.log('\n=== Next Steps ===');
console.log('1. If file exists and looks correct, restart your dev server:');
console.log('   - Press Ctrl+C to stop');
console.log('   - Run: npm run dev');
console.log('2. Check server console for environment variable logs');
console.log('3. Visit: http://localhost:3000/api/luma/generate');

