import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

export async function GET() {
  const lumaApiKey = process.env.LUMA_API_KEY;
  
  return NextResponse.json({
    message: "Luma API Test Endpoint",
    instructions: "Use POST method to test the Luma API",
    apiKeyConfigured: !!lumaApiKey,
    apiKeyLength: lumaApiKey ? lumaApiKey.length : 0,
    example: {
      method: "POST",
      url: "/api/test-luma",
      body: { prompt: "A simple test animation" }
    }
  });
}

export async function POST(req) {
  try {
    const lumaApiKey = process.env.LUMA_API_KEY;
    
    if (!lumaApiKey) {
      return NextResponse.json(
        { error: "LUMA_API_KEY not found in environment" },
        { status: 500 }
      );
    }

    const { prompt } = await req.json() || {};
    const testPrompt = prompt || "A simple test animation";

    // Minimal request body matching Luma API requirements
    // Testing with exact same format as generate-video route
    const requestBody = {
      prompt: testPrompt,
      model: 'ray-2',
      aspect_ratio: '16:9',
      duration: '10s', // Must be '5s', '9s', or '10s'
    };

    console.log('[Test Luma] Full request details:');
    console.log('[Test Luma] Endpoint: https://api.lumalabs.ai/dream-machine/v1/generations');
    console.log('[Test Luma] Method: POST');
    console.log('[Test Luma] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('[Test Luma] API Key prefix:', lumaApiKey.substring(0, 10) + '...');

    console.log('[Test Luma] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('[Test Luma] API Key exists:', !!lumaApiKey);
    console.log('[Test Luma] API Key length:', lumaApiKey.length);

    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lumaApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[Test Luma] Response status:', response.status);
    console.log('[Test Luma] Response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      requestBody: requestBody,
      response: responseData,
      apiKeyConfigured: !!lumaApiKey,
      apiKeyLength: lumaApiKey.length,
    }, {
      status: response.ok ? 200 : response.status,
    });

  } catch (error) {
    console.error('[Test Luma] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
