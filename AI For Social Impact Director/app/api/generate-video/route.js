import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'

// Startup log - runs when module loads
console.log('[Luma API Route] LUMA key loaded:', !!process.env.LUMA_API_KEY);

export async function GET() {
  return NextResponse.json({
    message: "Luma Video Generation API",
    method: "Use POST to generate videos",
    endpoint: "/api/generate-video",
    requiredBody: {
      script: "string (minimum 60 characters)"
    },
    apiKeyConfigured: !!process.env.LUMA_API_KEY,
  });
}

export async function POST(req) {
  try {
    // Parse request body with better error handling
    let script;
    try {
      const body = await req.json();
      script = body.script;
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON with 'script' field." },
        { status: 400 }
      );
    }
    
    if (!script || script.trim().length < 60) {
      return NextResponse.json(
        { error: "Script must be at least 60 characters long" },
        { status: 400 }
      );
    }

    // Server-side environment variable access
    const lumaApiKey = process.env.LUMA_API_KEY;

    // Debug logging (server-side only)
    console.log('[Luma API] Environment check:');
    console.log('[Luma API] - LUMA_API_KEY exists:', !!lumaApiKey);
    console.log('[Luma API] - LUMA_API_KEY length:', lumaApiKey ? lumaApiKey.length : 0);
    console.log('[Luma API] - NODE_ENV:', process.env.NODE_ENV);

    if (!lumaApiKey) {
      console.error('LUMA_API_KEY is missing from environment variables');
      return NextResponse.json(
        { 
          error: "Luma API key not configured",
          hint: "Please ensure LUMA_API_KEY is set in .env.local and restart the dev server"
        },
        { status: 500 }
      );
    }

    // Create a video prompt from the script
    // Format the script into a concise video generation prompt
    const videoPrompt = `A 2D animation about Sustainable Development Goals. ${script.substring(0, 500)}. Bright colors, clean animation style, educational and inspiring.`;

    // Step 1: Create a video generation request with Luma API
    // Based on official OpenAPI spec and curl examples
    console.log('Creating video with Luma API...');
    
    // Luma API endpoint - correct endpoint for video generation
    const endpoints = [
      'https://api.lumalabs.ai/dream-machine/v1/generations', // Correct endpoint per Luma API docs
    ];
    
    // According to Luma API documentation:
    // - Required: prompt, model, aspect_ratio, duration
    // - Optional: resolution
    // - Duration: '5s' or '9s' for ray-2 model (ray-2 does NOT support '10s')
    // - Aspect ratios: '1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'
    // - Resolutions: '540p', '720p', '1080p', '4k'
    const requestBody = {
      prompt: videoPrompt,
      model: 'ray-flash-2', // Cheaper model for cost optimization
      aspect_ratio: '16:9',
      duration: '9s', // 9 seconds per clip
      resolution: '540p', // Cheapest resolution (no upscale)
      // resolution: '720p', // Optional - removing to simplify request
    };

    let generationData = null;
    let generationId = null;
    let lastError = null;

    for (const apiUrl of endpoints) {
      try {
        console.log(`[Luma API] Trying endpoint: ${apiUrl}`);
        console.log('[Luma API] Request body:', JSON.stringify(requestBody, null, 2));
        console.log('[Luma API] Authorization header:', `Bearer ${lumaApiKey.substring(0, 20)}...`);

        const createResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lumaApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        // Read response once and store it
        const responseText = await createResponse.text();
        console.log(`[Luma API] Response status: ${createResponse.status}`);
        console.log('[Luma API] Response headers:', Object.fromEntries(createResponse.headers.entries()));
        console.log('[Luma API] Response text:', responseText);

        // Accept 201 (Created) or 200 (OK)
        if (createResponse.ok || createResponse.status === 201) {
          try {
            generationData = JSON.parse(responseText);
            console.log(`[Luma API] ✅ SUCCESS with ${apiUrl}! Video generation started:`, JSON.stringify(generationData, null, 2));
            
            // According to spec: Generation object has id (uuid format)
            generationId = generationData.id;
            
            if (generationId) {
              console.log(`[Luma API] Generation ID: ${generationId}, State: ${generationData.state || 'unknown'}`);
              break; // Success, exit loop
            } else {
              console.error('[Luma API] No ID in response:', generationData);
              lastError = `No generation ID in response. Full response: ${responseText}`;
            }
          } catch (parseErr) {
            console.error('[Luma API] Failed to parse response:', parseErr);
            console.error('[Luma API] Raw response text:', responseText);
            lastError = `Parse error: ${parseErr.message}. Response: ${responseText.substring(0, 500)}`;
          }
        } else {
          let errorDetail = responseText;
          let errorObj = null;
          try {
            errorObj = JSON.parse(responseText);
            errorDetail = errorObj.detail || errorObj.message || errorObj.error || responseText;
          } catch {
            // Keep original text if not JSON
          }
          
          console.error(`[Luma API] ❌ ${apiUrl} failed: ${createResponse.status}`);
          console.error(`[Luma API] Error detail: ${errorDetail}`);
          console.error(`[Luma API] Full error object:`, errorObj || responseText);
          lastError = `Status ${createResponse.status}: ${errorDetail}`;
          
          // If 401/403, don't try next endpoint
          if (createResponse.status === 401 || createResponse.status === 403) {
            throw new Error(`Authentication failed (${createResponse.status}): ${errorDetail}`);
          }
        }
      } catch (err) {
        console.error(`[Luma API] Error with ${apiUrl}:`, err.message);
        console.error(`[Luma API] Error stack:`, err.stack);
        if (err.message.includes('Authentication')) {
          throw err; // Don't continue if auth fails
        }
        lastError = `${err.message} (${apiUrl})`;
        continue; // Try next endpoint
      }
    }

    if (!generationId) {
      const fullError = `Failed to create video generation. Tried ${endpoints.length} endpoints. Last error: ${lastError || 'Unknown error'}`;
      console.error('[Luma API]', fullError);
      throw new Error(fullError);
    }

    // Step 2: Poll for video completion
    // According to OpenAPI spec: GET /generations/{id}
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 seconds per attempt)

    const statusUrl = `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`;

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      try {
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${lumaApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`Poll attempt ${attempts + 1}: Generation status:`, statusData.state);
          
          // According to spec: state enum: queued, dreaming, completed, failed
          const state = statusData.state;
          
          if (state === 'completed') {
            // According to spec: assets.video contains the URL
            videoUrl = statusData.assets?.video;
            if (videoUrl) {
              console.log('✅ Video completed! URL:', videoUrl);
              break;
            }
          } else if (state === 'failed') {
            const failureReason = statusData.failure_reason || 'Unknown error';
            throw new Error(`Video generation failed: ${failureReason}`);
          }
          // Continue polling if state is 'queued' or 'dreaming'
        } else {
          const errorText = await statusResponse.text();
          console.error(`Status check failed: ${statusResponse.status} - ${errorText}`);
        }
      } catch (err) {
        console.error(`Status check error:`, err.message);
        if (err.message.includes('failed')) {
          throw err; // Re-throw if generation failed
        }
      }

      attempts++;
    }

    // Create a simple storyboard from the script
    const storyboard = {
      title: script.split('\n')[0] || "SDG Animation",
      summary: script.substring(0, 200),
      scenes: [
        {
          sceneNumber: 1,
          description: script.substring(0, 300),
          duration: 9, // Matches Luma API duration (9 seconds for ray-2 model)
          visualStyle: "2D animation with bright colors"
        }
      ]
    };

    // Return the generated content
    return NextResponse.json({
      id: generationId || `video_${Date.now()}`,
      status: videoUrl ? "completed" : "processing",
      script: script,
      storyboard: storyboard,
      scenes: videoUrl ? [{
        sceneNumber: 1,
        imageUrl: null, // Video instead of image
        videoUrl: videoUrl,
        description: storyboard.summary,
      }] : [],
      model: "luma-dream-machine",
      created_at: new Date().toISOString(),
      video_url: videoUrl,
      generation_id: generationId,
    });

  } catch (error) {
    console.error("[Luma API] Error generating video:", error);
    console.error("[Luma API] Error message:", error.message);
    console.error("[Luma API] Error stack:", error.stack);
    
    // Return a more helpful error message with details
    let errorMessage = error.message || "Failed to generate video";
    let statusCode = 500;
    
    if (error.message?.includes("API key") || error.message?.includes("401") || error.message?.includes("403") || error.message?.includes("Authentication")) {
      statusCode = 401;
      errorMessage = "Authentication failed. Please verify your Luma API key is correct.";
      
      // Provide helpful troubleshooting steps
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.message,
          troubleshooting: [
            "1. Check that LUMA_API_KEY is set in .env.local file",
            "2. Verify the API key is correct (no extra spaces or quotes)",
            "3. Restart your dev server after updating .env.local",
            "4. Check if the API key has expired or been revoked",
            "5. Verify the key format matches: luma-xxxxx-xxxxx-xxxxx..."
          ],
          hint: "Check server console for detailed error logs. Make sure to restart the server after updating .env.local"
        },
        { 
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // Check if it's an endpoint/network error
    if (error.message?.includes("endpoint") || error.message?.includes("Failed to create video generation")) {
      errorMessage = `Luma API request failed: ${error.message}`;
      statusCode = 502; // Bad Gateway - API call failed
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        hint: "Check server console for detailed error logs. The Luma API may require different endpoints or authentication format."
      },
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

