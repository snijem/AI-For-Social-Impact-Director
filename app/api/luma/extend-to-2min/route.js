import { NextResponse } from "next/server";
import path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

export const dynamic = 'force-dynamic'
// Allow long-running requests (up to 10 minutes for 7 clips)
export const maxDuration = 600 // 10 minutes in seconds
export const runtime = 'nodejs' // Ensure Node.js runtime for long operations

const execAsync = promisify(exec)

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1'
const DURATION_PER_GENERATION = 9 // 9 seconds per clip (estimated, actual may vary)
const TARGET_SECONDS = 60 // 1 minute target (60 seconds)
const TARGET_MAX_SECONDS = 65 // Stop if we exceed this (just a bit over 1 minute)
const MAX_CLIPS = Math.ceil(TARGET_SECONDS / DURATION_PER_GENERATION) // 60 / 9 = 7 clips (63 seconds total)
const DEFAULT_MODEL = 'ray-flash-2' // Cheaper model
const DEFAULT_RESOLUTION = '540p' // Cheapest resolution
const COST_PER_CLIP = 0.25 // $0.25 per clip (ray-flash-2, 540p, 9s)
const MAX_BUDGET = 2.00 // $2 maximum budget

/**
 * Get the actual duration of a video file using ffprobe
 * @param {string} videoUrl - URL of the video
 * @returns {Promise<number>} Duration in seconds
 */
async function getVideoDuration(videoUrl) {
  try {
    // Download video temporarily to get duration
    const tempDir = path.join(process.cwd(), 'tmp', 'videos')
    await fs.mkdir(tempDir, { recursive: true })
    const tempPath = path.join(tempDir, `duration_check_${Date.now()}.mp4`)
    
    try {
      // Download video
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }
      const buffer = await response.arrayBuffer()
      await fs.writeFile(tempPath, Buffer.from(buffer))
      
      // Use ffprobe to get duration
      const escapedPath = tempPath.replace(/\\/g, '/').replace(/'/g, "'\\''")
      const ffprobeCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${escapedPath}"`
      
      const { stdout } = await execAsync(ffprobeCommand)
      const duration = parseFloat(stdout.trim())
      
      // Cleanup
      await fs.unlink(tempPath).catch(() => {})
      
      if (isNaN(duration) || duration <= 0) {
        console.warn(`[Luma Extend] Invalid duration from ffprobe: ${duration}, using estimated ${DURATION_PER_GENERATION}s`)
        return DURATION_PER_GENERATION
      }
      
      console.log(`[Luma Extend] Video duration: ${duration.toFixed(2)}s (from ${videoUrl})`)
      return duration
    } catch (error) {
      // Cleanup on error
      await fs.unlink(tempPath).catch(() => {})
      throw error
    }
  } catch (error) {
    console.warn(`[Luma Extend] Failed to get video duration: ${error.message}, using estimated ${DURATION_PER_GENERATION}s`)
    return DURATION_PER_GENERATION // Fallback to estimated duration
  }
}

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

  // Generate clips until we reach just over 1 minute (60-65 seconds) or max clips
  // Check actual duration before each iteration to avoid going too far over
  while (totalSeconds < TARGET_SECONDS && iteration < MAX_CLIPS) {
    iteration++;
    estimatedCost = iteration * COST_PER_CLIP;
    
    // Check if we should continue (safety check before starting new generation)
    if (totalSeconds >= TARGET_MAX_SECONDS) {
      console.log(`[Luma Extend] Already at or above maximum duration (${totalSeconds.toFixed(2)}s >= ${TARGET_MAX_SECONDS}s), stopping`);
      break;
    }
    
    console.log(`[Luma Extend] ===== Starting Generation ${iteration}/${MAX_CLIPS} =====`);
    console.log(`[Luma Extend] Current progress: ${totalSeconds.toFixed(2)}s / ${TARGET_SECONDS}s (max: ${TARGET_MAX_SECONDS}s)`);
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
        
        // Get actual video duration
        console.log(`[Luma Extend] Getting actual duration for clip ${iteration}...`);
        const actualDuration = await getVideoDuration(videoUrl);
        
        const newGeneration = {
          id: generationId,
          videoUrl: videoUrl,
          seconds: actualDuration, // Use actual duration instead of estimated
          iteration: iteration,
        };
        
        // Check if this video URL is a duplicate
        const isDuplicate = generations.some(g => g.videoUrl === videoUrl);
        if (isDuplicate) {
          console.warn(`[Luma Extend] WARNING: Generation ${iteration} has duplicate video URL: ${videoUrl}`);
          console.warn(`[Luma Extend] Previous generations:`, generations.map(g => ({ id: g.id, url: g.videoUrl })));
        }
        
        generations.push(newGeneration);
        totalSeconds += actualDuration; // Add actual duration to total
        previousGenerationId = generationId;

        console.log(`[Luma Extend] Generation ${iteration} completed:`);
        console.log(`[Luma Extend]   Generation ID: ${generationId}`);
        console.log(`[Luma Extend]   Video URL: ${videoUrl}`);
        console.log(`[Luma Extend]   Actual duration: ${actualDuration.toFixed(2)}s`);
        console.log(`[Luma Extend]   Total duration so far: ${totalSeconds.toFixed(2)}s / ${TARGET_SECONDS}s`);
        console.log(`[Luma Extend]   Previous generation ID for next clip: ${previousGenerationId}`);

      sendProgress({
        type: 'clip_complete',
        message: `Clip ${iteration} completed (${actualDuration.toFixed(1)}s)! Total: ${totalSeconds.toFixed(1)}s`,
        current: iteration,
        total: MAX_CLIPS,
        totalSeconds: totalSeconds,
        estimatedCost: estimatedCost,
        status: 'completed',
        clip: newGeneration,
      });

        // Check if we've reached the target (just over 1 minute)
        if (totalSeconds >= TARGET_SECONDS) {
          if (totalSeconds > TARGET_MAX_SECONDS) {
            console.warn(`[Luma Extend] Total duration (${totalSeconds.toFixed(2)}s) exceeds max (${TARGET_MAX_SECONDS}s), but continuing...`);
          } else {
            console.log(`[Luma Extend] Target reached: ${totalSeconds.toFixed(2)}s (within ${TARGET_SECONDS}-${TARGET_MAX_SECONDS}s range)`);
            break;
          }
        }
        
        // Also stop if we exceed the maximum to avoid going too far over
        if (totalSeconds > TARGET_MAX_SECONDS) {
          console.log(`[Luma Extend] Maximum duration exceeded: ${totalSeconds.toFixed(2)}s > ${TARGET_MAX_SECONDS}s, stopping generation`);
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

    // Log completion with actual durations
    const calculatedTotal = generations.reduce((sum, g) => sum + (g.seconds || 0), 0);
    console.log(`[Luma Extend] Loop completed. Total generations: ${generations.length}, Total actual duration: ${calculatedTotal.toFixed(2)}s`);
    console.log(`[Luma Extend] Target was ${TARGET_SECONDS}s, achieved ${calculatedTotal.toFixed(2)}s (${((calculatedTotal / TARGET_SECONDS) * 100).toFixed(1)}% of target)`);
    // Update totalSeconds to match calculated total (in case of rounding differences)
    totalSeconds = calculatedTotal;

  // Calculate final cost
  const finalCost = generations.length * COST_PER_CLIP;
  
  // Step: Merge all clips into one continuous video
  let mergedVideoUrl = null;
  const videoUrls = generations.map(g => g.videoUrl).filter(url => url);
  
  // Log all video URLs for debugging
  console.log(`[Luma Extend] Collected ${videoUrls.length} video URLs for merging:`);
  videoUrls.forEach((url, index) => {
    console.log(`[Luma Extend]   Clip ${index + 1}: ${url}`);
  });
  
  // Check for duplicate URLs
  const uniqueUrls = [...new Set(videoUrls)];
  if (uniqueUrls.length < videoUrls.length) {
    console.warn(`[Luma Extend] WARNING: Found ${videoUrls.length - uniqueUrls.length} duplicate video URLs!`);
    console.warn(`[Luma Extend] Using only ${uniqueUrls.length} unique clips instead of ${videoUrls.length}`);
    
    // If all videos are the same, this is a problem
    if (uniqueUrls.length === 1) {
      console.error(`[Luma Extend] ERROR: All ${videoUrls.length} clips have the same video URL!`);
      console.error(`[Luma Extend] This suggests the keyframe extension is not working properly.`);
      console.error(`[Luma Extend] Video URL: ${uniqueUrls[0]}`);
      throw new Error(`All generated clips have the same video URL. The keyframe extension may not be working correctly.`);
    }
  }
  
  if (uniqueUrls.length > 1) {
    console.log(`[Luma Extend] Merging ${uniqueUrls.length} unique clips into one continuous video...`);
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
        
        // Merge videos (use unique URLs only)
        await mergeVideos(uniqueUrls, mergedVideoPath);
        
        // Create URL for merged video via API route (more reliable than direct public folder access)
        mergedVideoUrl = `/api/video/${mergedFileName}`;
        
        console.log(`[Luma Extend] Videos merged successfully: ${mergedVideoUrl}`);
      } else {
        console.warn(`[Luma Extend] FFmpeg not available, using first video as fallback`);
        mergedVideoUrl = uniqueUrls[0] || videoUrls[0];
      }
    } catch (mergeError) {
      console.error(`[Luma Extend] Error merging videos:`, mergeError);
      console.warn(`[Luma Extend] Using first video as fallback due to merge error`);
      mergedVideoUrl = uniqueUrls[0] || videoUrls[0];
    }
  } else if (uniqueUrls.length === 1) {
    mergedVideoUrl = uniqueUrls[0];
  } else if (videoUrls.length === 1) {
    mergedVideoUrl = videoUrls[0];
  }
  
  // Calculate actual total duration from all clips
  const actualTotalDuration = generations.reduce((sum, g) => sum + (g.seconds || 0), 0);
  
  // Send final result with merged video URL
  sendProgress({
    type: 'complete',
    message: `Generated ${generations.length} clips totaling ${actualTotalDuration.toFixed(1)} seconds${mergedVideoUrl && uniqueUrls.length > 1 ? ' (merged into one video)' : ''}`,
    current: generations.length,
    total: MAX_CLIPS,
    totalSeconds: actualTotalDuration, // Use actual duration
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
