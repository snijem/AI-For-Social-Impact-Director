import { NextResponse } from "next/server";
import path from 'path'
import fs from 'fs/promises'

export const dynamic = 'force-dynamic'
// Allow long-running requests (up to 10 minutes for 7 clips)
export const maxDuration = 600 // 10 minutes in seconds
export const runtime = 'nodejs' // Ensure Node.js runtime for long operations

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1'
const DURATION_PER_GENERATION = 9 // 9 seconds per clip
const TARGET_SECONDS = 60 // 1 minute target (60 seconds)
const MAX_CLIPS = Math.ceil(TARGET_SECONDS / DURATION_PER_GENERATION) // 60 / 9 = 7 clips (63 seconds total)
const DEFAULT_MODEL = 'ray-flash-2' // Cheaper model
const DEFAULT_RESOLUTION = '540p' // Cheapest resolution
const COST_PER_CLIP = 0.25 // $0.25 per clip (ray-flash-2, 540p, 9s)
const MAX_BUDGET = 2.00 // $2 maximum budget

/**
 * Poll for generation completion
 */
async function pollGenerationStatus(generationId, lumaApiKey, maxAttempts = 60) {
  return pollGenerationStatusWithProgress(generationId, lumaApiKey, null, maxAttempts);
}

/**
 * Poll for generation completion with progress callback
 */
async function pollGenerationStatusWithProgress(generationId, lumaApiKey, progressCallback = null, maxAttempts = 60) {
  const statusUrl = `${LUMA_API_BASE}/generations/${generationId}`;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;

    if (progressCallback) {
      progressCallback(attempts, maxAttempts);
    }

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
        const state = statusData.state;

        console.log(`[Luma Extend] Generation ${generationId} state: ${state} (attempt ${attempts}/${maxAttempts})`);

        if (state === 'completed') {
          const videoUrl = statusData.assets?.video;
          if (videoUrl) {
            console.log(`[Luma Extend] Generation ${generationId} completed with video: ${videoUrl}`);
            return { success: true, videoUrl, data: statusData };
          } else {
            console.warn(`[Luma Extend] Generation ${generationId} completed but no video URL found`);
          }
        } else if (state === 'failed') {
          const failureReason = statusData.failure_reason || 'Unknown error';
          console.error(`[Luma Extend] Generation ${generationId} failed: ${failureReason}`);
          return { success: false, error: `Generation failed: ${failureReason}` };
        }
        // Continue polling if 'queued' or 'dreaming'
      } else {
        const errorText = await statusResponse.text();
        console.error(`[Luma Extend] Status check failed: ${statusResponse.status} - ${errorText}`);
      }
    } catch (err) {
      console.error(`[Luma Extend] Status check error:`, err.message);
    }
  }

  console.error(`[Luma Extend] Generation ${generationId} timeout after ${maxAttempts} attempts`);
  return { success: false, error: 'Generation timeout - took too long' };
}

/**
 * Create a new video generation
 */
async function createGeneration(prompt, lumaApiKey, previousGenerationId = null) {
  const requestBody = {
    prompt: prompt,
    model: DEFAULT_MODEL, // ray-flash-2 (cheaper)
    aspect_ratio: '16:9',
    duration: '9s', // 9 seconds per clip
    resolution: DEFAULT_RESOLUTION, // 540p (cheapest, no upscale)
  };

  // If extending from previous generation, add keyframes
  if (previousGenerationId) {
    requestBody.keyframes = {
      frame1: {
        type: 'generation',
        id: previousGenerationId
      }
    };
  }

  console.log(`[Luma Extend] Creating generation ${previousGenerationId ? '(extending)' : '(first)'}...`);
  console.log(`[Luma Extend] Request body:`, JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${LUMA_API_BASE}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lumaApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log(`[Luma Extend] Response status: ${response.status}`);
  console.log(`[Luma Extend] Response:`, responseText);

  if (!response.ok) {
    let errorDetail = responseText;
    try {
      const errorData = JSON.parse(responseText);
      errorDetail = errorData.detail || errorData.message || errorData.error || responseText;
    } catch {
      // Keep original text
    }
    throw new Error(`Luma API error (${response.status}): ${errorDetail}`);
  }

  const generationData = JSON.parse(responseText);
  return generationData;
}

export async function POST(req) {
  // Check if client wants streaming (SSE) or regular JSON response
  const acceptHeader = req.headers.get('accept') || '';
  const useStreaming = acceptHeader.includes('text/event-stream');

  if (useStreaming) {
    return handleStreamingRequest(req);
  } else {
    return handleRegularRequest(req);
  }
}

async function handleStreamingRequest(req) {
  const encoder = new TextEncoder();
  let sendProgress = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      sendProgress = (data) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('[Luma Extend] Error sending progress:', error);
        }
      };

      // Send keep-alive ping every 30 seconds to prevent timeout
      const keepAliveInterval = setInterval(() => {
        if (!isClosed) {
          try {
            sendProgress({ type: 'ping', timestamp: Date.now() });
          } catch (error) {
            console.error('[Luma Extend] Keep-alive ping failed:', error);
            clearInterval(keepAliveInterval);
          }
        } else {
          clearInterval(keepAliveInterval);
        }
      }, 30000); // 30 seconds

      try {
        const { prompt, model = DEFAULT_MODEL } = await req.json();
        
        // Check budget before starting
        const estimatedCost = MAX_CLIPS * COST_PER_CLIP;
        if (estimatedCost > MAX_BUDGET) {
          sendProgress({ 
            type: 'error', 
            error: `Estimated cost ($${estimatedCost.toFixed(2)}) exceeds maximum budget ($${MAX_BUDGET})`,
            estimatedCost: estimatedCost,
            maxBudget: MAX_BUDGET,
          });
          isClosed = true;
          clearInterval(keepAliveInterval);
          controller.close();
          return;
        }

        if (!prompt || prompt.trim().length < 10) {
          sendProgress({ type: 'error', error: "Prompt is required and must be at least 10 characters" });
          isClosed = true;
          clearInterval(keepAliveInterval);
          controller.close();
          return;
        }

        const lumaApiKey = process.env.LUMA_API_KEY;
        if (!lumaApiKey) {
          sendProgress({ type: 'error', error: "Luma API key not configured" });
          isClosed = true;
          clearInterval(keepAliveInterval);
          controller.close();
          return;
        }

        await generateClipsWithProgress(prompt, lumaApiKey, sendProgress);
        isClosed = true;
        clearInterval(keepAliveInterval);
        controller.close();
      } catch (error) {
        console.error('[Luma Extend] Error in streaming request:', error);
        if (!isClosed) {
          sendProgress({ type: 'error', error: error.message || 'Generation failed' });
        }
        isClosed = true;
        clearInterval(keepAliveInterval);
        controller.close();
      }
    },
    cancel() {
      // Handle cancellation
      isClosed = true;
      console.log('[Luma Extend] Stream cancelled by client');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx/proxies
    },
  });
}

async function handleRegularRequest(req) {
  try {
    const { prompt, model = 'ray-2' } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt is required and must be at least 10 characters" },
        { status: 400 }
      );
    }

    const lumaApiKey = process.env.LUMA_API_KEY;
    if (!lumaApiKey) {
      return NextResponse.json(
        { error: "Luma API key not configured" },
        { status: 500 }
      );
    }

    const generations = [];
    await generateClipsWithProgress(prompt, lumaApiKey, (progress) => {
      // For non-streaming, just log progress
      console.log(`[Luma Extend] ${progress.message || 'Progress'}:`, progress);
      if (progress.type === 'clip_complete' && progress.clip) {
        generations.push(progress.clip);
      }
    });

    // Calculate totals
    const totalSeconds = generations.length * DURATION_PER_GENERATION;

    // Return final result
    return NextResponse.json({
      success: true,
      generations: generations,
      totalSeconds: totalSeconds,
      totalClips: generations.length,
      message: `Generated ${generations.length} clips totaling ${totalSeconds} seconds`,
    });
  } catch (error) {
    console.error('[Luma Extend] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate extended video',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function generateClipsWithProgress(prompt, lumaApiKey, sendProgress) {
  console.log('[Luma Extend] Starting 1-minute video generation...');
  console.log(`[Luma Extend] Target: ${TARGET_SECONDS} seconds (${MAX_CLIPS} clips × ${DURATION_PER_GENERATION}s = ${MAX_CLIPS * DURATION_PER_GENERATION}s total)`);
  console.log(`[Luma Extend] Model: ${DEFAULT_MODEL}, Resolution: ${DEFAULT_RESOLUTION}`);
  console.log(`[Luma Extend] Cost per clip: $${COST_PER_CLIP}, Total cost: $${(MAX_CLIPS * COST_PER_CLIP).toFixed(2)}, Max budget: $${MAX_BUDGET}`);

  const generations = [];
  let previousGenerationId = null;
  let totalSeconds = 0;
  let iteration = 0;
  let estimatedCost = 0;

  const estimatedTotalCost = MAX_CLIPS * COST_PER_CLIP;
  sendProgress({
    type: 'start',
    message: 'Starting 1-minute video generation...',
    current: 0,
    total: MAX_CLIPS,
    totalSeconds: 0,
    estimatedCost: estimatedTotalCost,
    maxBudget: MAX_BUDGET,
    costPerClip: COST_PER_CLIP,
  });

  // Generate clips until we reach 1 minute or max clips
  while (totalSeconds < TARGET_SECONDS && iteration < MAX_CLIPS) {
    iteration++;
    estimatedCost = iteration * COST_PER_CLIP;
    
    console.log(`[Luma Extend] ===== Starting Generation ${iteration}/${MAX_CLIPS} =====`);
    console.log(`[Luma Extend] Current progress: ${totalSeconds}s / ${TARGET_SECONDS}s`);
    console.log(`[Luma Extend] Estimated cost: $${estimatedCost.toFixed(2)}`);
    console.log(`[Luma Extend] Previous generation ID: ${previousGenerationId || 'none (first clip)'}`);

    sendProgress({
      type: 'progress',
      message: `Creating generation ${iteration}...`,
      current: iteration,
      total: MAX_CLIPS,
      totalSeconds: totalSeconds,
      estimatedCost: estimatedCost,
      status: 'creating',
    });

    try {
      // Create generation
      const generationData = await createGeneration(
        prompt,
        lumaApiKey,
        previousGenerationId
      );

      const generationId = generationData.id;
      if (!generationId) {
        throw new Error('No generation ID returned');
      }

      console.log(`[Luma Extend] Generation ${iteration} created, ID: ${generationId}`);

      sendProgress({
        type: 'progress',
        message: `Waiting for clip ${iteration} to complete...`,
        current: iteration,
        total: MAX_CLIPS,
        totalSeconds: totalSeconds,
        estimatedCost: estimatedCost,
        status: 'polling',
        generationId: generationId,
      });

      // Poll for completion with progress updates
      let pollAttempt = 0;
      const pollResult = await pollGenerationStatusWithProgress(
        generationId, 
        lumaApiKey, 
        (attempt, maxAttempts) => {
          pollAttempt = attempt;
          sendProgress({
            type: 'progress',
            message: `Polling clip ${iteration}... (attempt ${attempt}/${maxAttempts})`,
            current: iteration,
            total: MAX_CLIPS,
            totalSeconds: totalSeconds,
            estimatedCost: estimatedCost,
            status: 'polling',
            generationId: generationId,
            pollAttempt: attempt,
          });
        }
      );
      
      if (!pollResult.success) {
        console.error(`[Luma Extend] Polling failed for generation ${iteration}:`, pollResult.error);
        throw new Error(pollResult.error || 'Generation failed');
      }

        const videoUrl = pollResult.videoUrl;
        const newGeneration = {
          id: generationId,
          videoUrl: videoUrl,
          seconds: DURATION_PER_GENERATION,
          iteration: iteration,
        };
        
        generations.push(newGeneration);
        totalSeconds += DURATION_PER_GENERATION;
        previousGenerationId = generationId;

        console.log(`[Luma Extend] Generation ${iteration} completed: ${videoUrl}`);
        console.log(`[Luma Extend] Progress: ${totalSeconds}s / ${TARGET_SECONDS}s`);
        console.log(`[Luma Extend] Previous generation ID for next clip: ${previousGenerationId}`);

      sendProgress({
        type: 'clip_complete',
        message: `Clip ${iteration} completed! Starting next clip...`,
        current: iteration,
        total: MAX_CLIPS,
        totalSeconds: totalSeconds,
        estimatedCost: estimatedCost,
        status: 'completed',
        clip: newGeneration,
      });

        // If we've reached target, stop
        if (totalSeconds >= TARGET_SECONDS) {
          console.log(`[Luma Extend] Target reached: ${totalSeconds}s`);
          break;
        }

        // Small delay before starting next generation
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[Luma Extend] Error in generation ${iteration}:`, error);
        console.error(`[Luma Extend] Error stack:`, error.stack);
        sendProgress({
          type: 'error',
          error: `Failed at generation ${iteration}`,
          details: error.message,
          completedGenerations: generations,
          totalSeconds: totalSeconds,
          iteration: iteration,
        });
        // Don't throw - continue with next iteration if possible
        // Only throw if it's the first generation (can't continue)
        if (iteration === 1) {
          throw error;
        }
        // For subsequent generations, log error and try to continue
        console.warn(`[Luma Extend] Skipping generation ${iteration}, continuing with next...`);
        continue;
      }
    }

    console.log(`[Luma Extend] Loop completed. Total generations: ${generations.length}, Total seconds: ${totalSeconds}`);

  // Calculate final cost
  const finalCost = generations.length * COST_PER_CLIP;
  
  // Step: Merge all clips into one continuous video
  let mergedVideoUrl = null;
  const videoUrls = generations.map(g => g.videoUrl).filter(url => url);
  
  if (videoUrls.length > 1) {
    console.log(`[Luma Extend] Merging ${videoUrls.length} clips into one continuous video...`);
    sendProgress({
      type: 'progress',
      message: 'Merging clips into final video...',
      current: generations.length,
      total: MAX_CLIPS,
      totalSeconds: totalSeconds,
      estimatedCost: finalCost,
      status: 'merging',
    });

    try {
      // Dynamically import video-merger (server-side only)
      const { mergeVideos, checkFFmpegAvailable } = await import('@/lib/video-merger');
      
      // Check if ffmpeg is available
      const ffmpegAvailable = await checkFFmpegAvailable();
      
      if (ffmpegAvailable) {
        // Create output directory
        const outputDir = path.join(process.cwd(), 'public', 'merged-videos');
        await fs.mkdir(outputDir, { recursive: true });
        
        // Generate merged video filename
        const mergeId = `merge_${Date.now()}`;
        const mergedFileName = `merged_${mergeId}.mp4`;
        const mergedVideoPath = path.join(outputDir, mergedFileName);
        
        // Merge videos
        await mergeVideos(videoUrls, mergedVideoPath);
        
        // Create URL for merged video via API route (more reliable than direct public folder access)
        mergedVideoUrl = `/api/video/${mergedFileName}`;
        
        console.log(`[Luma Extend] Videos merged successfully: ${mergedVideoUrl}`);
      } else {
        console.warn(`[Luma Extend] FFmpeg not available, using first video as fallback`);
        mergedVideoUrl = videoUrls[0];
      }
    } catch (mergeError) {
      console.error(`[Luma Extend] Error merging videos:`, mergeError);
      console.warn(`[Luma Extend] Using first video as fallback due to merge error`);
      mergedVideoUrl = videoUrls[0];
    }
  } else if (videoUrls.length === 1) {
    mergedVideoUrl = videoUrls[0];
  }
  
  // Send final result with merged video URL
  sendProgress({
    type: 'complete',
    message: `Generated ${generations.length} clips totaling ${totalSeconds} seconds${mergedVideoUrl && videoUrls.length > 1 ? ' (merged into one video)' : ''}`,
    current: generations.length,
    total: MAX_CLIPS,
    totalSeconds: totalSeconds,
    estimatedCost: finalCost,
    totalCost: finalCost,
    generations: generations,
    mergedVideoUrl: mergedVideoUrl,
    videoUrl: mergedVideoUrl, // For compatibility
    success: true,
    model: DEFAULT_MODEL,
    resolution: DEFAULT_RESOLUTION,
  });

  return { generations, totalSeconds, mergedVideoUrl };
}
