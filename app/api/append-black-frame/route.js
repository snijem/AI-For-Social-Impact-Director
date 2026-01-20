import { NextResponse } from "next/server";
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * POST /api/append-black-frame
 * Appends a 1-second black frame to the end of a video
 * @param {string} videoUrl - URL of the input video
 * @returns {string} URL of the final 9-second video
 */
export async function POST(req) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    console.log('[Append Black Frame] Starting process for:', videoUrl);

    // Create temp directory
    const tempDir = path.join(process.cwd(), 'tmp', 'videos');
    await fs.mkdir(tempDir, { recursive: true });

    // Create output directory
    const outputDir = path.join(process.cwd(), 'public', 'merged-videos');
    await fs.mkdir(outputDir, { recursive: true });

    const jobId = `append_black_${Date.now()}`;
    const inputVideoPath = path.join(tempDir, `${jobId}_input.mp4`);
    const blackVideoPath = path.join(tempDir, `${jobId}_black.mp4`);
    const outputVideoPath = path.join(outputDir, `${jobId}_9s.mp4`);
    const concatFilePath = path.join(tempDir, `${jobId}_concat.txt`);

    try {
      // Step 1: Download input video
      console.log('[Append Black Frame] Downloading input video...');
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      await fs.writeFile(inputVideoPath, Buffer.from(buffer));
      console.log('[Append Black Frame] Input video downloaded');

      // Step 2: Get video metadata (resolution and fps)
      console.log('[Append Black Frame] Getting video metadata...');
      const probeCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of json "${inputVideoPath}"`;
      const { stdout: probeOutput } = await execAsync(probeCommand);
      const probeData = JSON.parse(probeOutput);
      
      const width = probeData.streams[0]?.width || 1280;
      const height = probeData.streams[0]?.height || 720;
      
      // Parse frame rate (e.g., "30/1" or "24/1")
      const frameRateStr = probeData.streams[0]?.r_frame_rate || '30/1';
      const [num, den] = frameRateStr.split('/').map(Number);
      const fps = den ? (num / den) : 30;

      console.log(`[Append Black Frame] Video metadata: ${width}x${height} @ ${fps}fps`);

      // Step 3: Generate 1-second black video with matching resolution and fps
      console.log('[Append Black Frame] Generating 1-second black video...');
      const blackFrameCommand = `ffmpeg -f lavfi -i color=c=black:s=${width}x${height}:d=1:r=${fps} -c:v libx264 -pix_fmt yuv420p "${blackVideoPath}" -y`;
      await execAsync(blackFrameCommand);
      console.log('[Append Black Frame] Black video generated');

      // Step 4: Create concat file list
      const escapedInputPath = inputVideoPath.replace(/\\/g, '/');
      const escapedBlackPath = blackVideoPath.replace(/\\/g, '/');
      const concatContent = `file '${escapedInputPath.replace(/'/g, "'\\''")}'\nfile '${escapedBlackPath.replace(/'/g, "'\\''")}'`;
      await fs.writeFile(concatFilePath, concatContent);
      console.log('[Append Black Frame] Concat file created');

      // Step 5: Concatenate videos
      console.log('[Append Black Frame] Concatenating videos...');
      const escapedConcatPath = path.resolve(concatFilePath).replace(/\\/g, '/');
      const escapedOutputPath = path.resolve(outputVideoPath).replace(/\\/g, '/');
      const concatCommand = `ffmpeg -f concat -safe 0 -i "${escapedConcatPath}" -c copy "${escapedOutputPath}" -y`;
      
      const { stdout, stderr } = await execAsync(concatCommand);
      console.log('[Append Black Frame] Videos concatenated successfully');
      
      // Verify output file exists
      await fs.access(outputVideoPath);
      const stats = await fs.stat(outputVideoPath);
      console.log(`[Append Black Frame] Final video created: ${outputVideoPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      // Step 6: Cleanup temp files
      console.log('[Append Black Frame] Cleaning up temp files...');
      try {
        await fs.unlink(inputVideoPath);
        await fs.unlink(blackVideoPath);
        await fs.unlink(concatFilePath);
      } catch (cleanupError) {
        console.warn('[Append Black Frame] Error cleaning up temp files:', cleanupError.message);
      }

      // Step 7: Return API URL for the final video
      const finalVideoUrl = `/api/video/${path.basename(outputVideoPath)}`;
      console.log('[Append Black Frame] Process completed:', finalVideoUrl);

      return NextResponse.json({
        success: true,
        videoUrl: finalVideoUrl,
        duration: 9, // 8 seconds + 1 second black frame
      });

    } catch (error) {
      console.error('[Append Black Frame] Error:', error);
      
      // Cleanup on error
      try {
        await fs.unlink(inputVideoPath).catch(() => {});
        await fs.unlink(blackVideoPath).catch(() => {});
        await fs.unlink(concatFilePath).catch(() => {});
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      // Return error but allow fallback to original video
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to append black frame',
          fallback: true, // Indicates caller should use original video
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Append Black Frame] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process video',
        fallback: true,
      },
      { status: 500 }
    );
  }
}

