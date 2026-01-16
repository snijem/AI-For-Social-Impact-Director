/**
 * Video Merger
 * Merges multiple video clips into one continuous video using ffmpeg
 * SERVER-ONLY: This module uses Node.js APIs and must only be imported server-side
 */

// Mark as server-only to prevent client bundling
if (typeof window !== 'undefined') {
  throw new Error('video-merger can only be used server-side')
}

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

/**
 * Download video from URL to local file
 * @param {string} videoUrl - URL of the video
 * @param {string} outputPath - Local path to save the video
 * @returns {Promise<string>} Path to downloaded file
 */
async function downloadVideo(videoUrl, outputPath) {
  try {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`)
    }
    
    const buffer = await response.arrayBuffer()
    await fs.writeFile(outputPath, Buffer.from(buffer))
    
    return outputPath
  } catch (error) {
    console.error(`[Video Merger] Error downloading ${videoUrl}:`, error)
    throw error
  }
}

/**
 * Merge multiple video clips into one video
 * @param {Array<string>} videoUrls - Array of video URLs to merge
 * @param {string} outputPath - Path for the merged video output
 * @returns {Promise<string>} Path to merged video file
 */
export async function mergeVideos(videoUrls, outputPath) {
  console.log(`[Video Merger] Starting merge of ${videoUrls.length} clips`)
  
  // Log all URLs being merged
  console.log(`[Video Merger] Video URLs to merge:`)
  videoUrls.forEach((url, index) => {
    console.log(`[Video Merger]   ${index + 1}. ${url}`)
  })
  
  // Check for duplicate URLs
  const uniqueUrls = [...new Set(videoUrls)]
  if (uniqueUrls.length < videoUrls.length) {
    console.warn(`[Video Merger] WARNING: ${videoUrls.length - uniqueUrls.length} duplicate URLs detected!`)
    console.warn(`[Video Merger] Will merge only ${uniqueUrls.length} unique videos`)
  }
  
  // Create temp directory (use process.cwd() for Next.js compatibility)
  const tempDir = path.join(process.cwd(), 'tmp', 'videos')
  await fs.mkdir(tempDir, { recursive: true })
  
  const jobId = `merge_${Date.now()}`
  const downloadedFiles = []
  
  try {
    // Step 1: Download all videos (use unique URLs only)
    const urlsToDownload = uniqueUrls.length < videoUrls.length ? uniqueUrls : videoUrls
    console.log(`[Video Merger] Downloading ${urlsToDownload.length} videos...`)
    for (let i = 0; i < urlsToDownload.length; i++) {
      const videoUrl = urlsToDownload[i]
      const localPath = path.join(tempDir, `${jobId}_clip_${i + 1}.mp4`)
      
      console.log(`[Video Merger] Downloading clip ${i + 1}/${urlsToDownload.length} from: ${videoUrl}`)
      await downloadVideo(videoUrl, localPath)
      
      // Verify file was downloaded and get its size
      const stats = await fs.stat(localPath)
      console.log(`[Video Merger]   Downloaded: ${localPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
      
      downloadedFiles.push(localPath)
    }
    
    // Step 2: Create concat file list for ffmpeg
    const concatFilePath = path.join(tempDir, `${jobId}_concat.txt`)
    const concatContent = downloadedFiles
      .map(file => `file '${file.replace(/'/g, "'\\''")}'`)
      .join('\n')
    
    await fs.writeFile(concatFilePath, concatContent)
    console.log(`[Video Merger] Created concat file with ${downloadedFiles.length} clips`)
    console.log(`[Video Merger] Concat file content:`)
    console.log(concatContent)
    
    // Step 3: Merge using ffmpeg
    console.log(`[Video Merger] Merging videos with ffmpeg...`)
    // Use absolute paths for Windows compatibility
    const absConcatPath = path.resolve(concatFilePath)
    const absOutputPath = path.resolve(outputPath)
    
    // Escape paths for Windows
    const escapedConcatPath = absConcatPath.replace(/\\/g, '/')
    const escapedOutputPath = absOutputPath.replace(/\\/g, '/')
    
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${escapedConcatPath}" -c copy "${escapedOutputPath}" -y`
    
    console.log(`[Video Merger] FFmpeg command: ${ffmpegCommand}`)
    
    const { stdout, stderr } = await execAsync(ffmpegCommand)
    console.log(`[Video Merger] FFmpeg output:`, stdout)
    if (stderr && !stderr.includes('frame=')) {
      // FFmpeg outputs progress to stderr, ignore it unless it's an error
      console.log(`[Video Merger] FFmpeg stderr:`, stderr)
    }
    
    // Verify output file exists
    await fs.access(outputPath)
    const stats = await fs.stat(outputPath)
    console.log(`[Video Merger] Merged video created: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
    
    // Cleanup temp files
    console.log(`[Video Merger] Cleaning up temp files...`)
    for (const file of downloadedFiles) {
      try {
        await fs.unlink(file)
      } catch (e) {
        console.warn(`[Video Merger] Failed to delete ${file}:`, e.message)
      }
    }
    try {
      await fs.unlink(concatFilePath)
    } catch (e) {
      console.warn(`[Video Merger] Failed to delete concat file:`, e.message)
    }
    
    return outputPath
    
  } catch (error) {
    console.error(`[Video Merger] Error merging videos:`, error)
    
    // Cleanup on error
    for (const file of downloadedFiles) {
      try {
        await fs.unlink(file)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    throw error
  }
}

/**
 * Check if ffmpeg is available
 * @returns {Promise<boolean>} True if ffmpeg is installed
 */
export async function checkFFmpegAvailable() {
  try {
    await execAsync('ffmpeg -version')
    return true
  } catch (error) {
    console.warn('[Video Merger] FFmpeg not found:', error.message)
    return false
  }
}
