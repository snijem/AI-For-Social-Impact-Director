import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// GET endpoint for easy testing
export async function GET() {
  // Try multiple ways to access the env variable
  const apiKey = process.env.LUMA_API_KEY;
  
  // Debug: Log all env vars that contain 'LUMA' or 'API'
  const allEnvKeys = Object.keys(process.env);
  const lumaRelatedKeys = allEnvKeys.filter(k => 
    k.toUpperCase().includes('LUMA') || 
    k.toUpperCase().includes('API')
  );

  // Try to read .env.local directly from filesystem
  let envFileContent = null;
  let envFileExists = false;
  try {
    const envPath = join(process.cwd(), '.env.local');
    envFileContent = readFileSync(envPath, 'utf8');
    envFileExists = true;
    console.log('.env.local file exists and is readable');
    console.log('.env.local contains LUMA:', envFileContent.includes('LUMA_API_KEY'));
  } catch (err) {
    console.log('.env.local file read error:', err.message);
  }

  console.log('=== Environment Variable Debug ===');
  console.log('LUMA_API_KEY exists:', !!apiKey);
  console.log('LUMA_API_KEY value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
  console.log('All env keys with LUMA/API:', lumaRelatedKeys);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('cwd:', process.cwd());
  console.log('.env.local file exists:', envFileExists);

  if (!apiKey) {
    return NextResponse.json(
      { 
        ok: false,
        error: "Luma API key not configured",
        hint: "Please ensure LUMA_API_KEY is set in .env.local and restart the dev server",
        debug: {
          envKeys: lumaRelatedKeys,
          nodeEnv: process.env.NODE_ENV,
          cwd: process.cwd(),
          allEnvKeysCount: allEnvKeys.length,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          envFileExists: envFileExists,
          envFileHasLuma: envFileContent ? envFileContent.includes('LUMA_API_KEY') : false,
          nextSteps: [
            "1. Verify .env.local exists at project root",
            "2. Check file contains: LUMA_API_KEY=your_key_here",
            "3. Stop dev server (Ctrl+C)",
            "4. Restart: npm run dev",
            "5. Check server console for debug logs"
          ]
        }
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Luma API key loaded successfully",
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10),
    // Never expose the actual key
  });
}

// POST endpoint for testing with prompt
export async function POST(req) {
  // Server-side only - this runs on the server
  const apiKey = process.env.LUMA_API_KEY;

  // Debug logging (only visible in server console)
  console.log('=== POST Request Debug ===');
  console.log('LUMA_API_KEY exists:', !!apiKey);
  console.log('LUMA_API_KEY length:', apiKey ? apiKey.length : 0);
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

  if (!apiKey) {
    return NextResponse.json(
      { 
        ok: false,
        error: "Luma API key not configured",
        hint: "Please ensure LUMA_API_KEY is set in .env.local and restart the dev server",
        debug: {
          envKeys: Object.keys(process.env).filter(k => k.includes('LUMA')),
          nodeEnv: process.env.NODE_ENV,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          cwd: process.cwd()
        }
      },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await req.json();

    // Return success response
    return NextResponse.json({
      ok: true,
      message: "Luma API key loaded successfully",
      promptReceived: prompt,
      keyLength: apiKey.length,
      // Never expose the actual key
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error.message },
      { status: 400 }
    );
  }
}

