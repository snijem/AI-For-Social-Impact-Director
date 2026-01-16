'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Result() {
  const router = useRouter()
  const [userScript, setUserScript] = useState('')
  const [videoData, setVideoData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    try {
      const script = sessionStorage.getItem('userScript') || ''
      const data = sessionStorage.getItem('videoData')
      const error = sessionStorage.getItem('errorMessage') || ''
      setUserScript(script)
      setErrorMessage(error)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          console.log('Video data loaded:', parsed)
          console.log('Video URL:', parsed.video_url)
          console.log('Is merged:', parsed.is_merged)
          console.log('Scenes count:', parsed.scenes_count)
          setVideoData(parsed)
        } catch (e) {
          console.error('Error parsing video data:', e)
          // Set fallback data if parsing fails
          setVideoData({
            status: 'error',
            script: script,
            error: 'Failed to parse video data',
          })
        }
      } else {
        console.warn('No video data found in sessionStorage')
        // Set fallback if no data exists
        if (script) {
          setVideoData({
            status: 'saved',
            script: script,
            storyboard: {
              title: script.split('\n')[0] || 'SDG Animation',
              summary: script.substring(0, 200),
            },
          })
        }
      }
    } catch (error) {
      console.error('Error loading result data:', error)
      // Ensure page still renders even if sessionStorage fails
      setErrorMessage('Unable to load saved data. Please try creating a new story.')
    }
  }, [])

  // Always show result page (no fail mode)
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
            className="text-8xl mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {errorMessage ? 'Your Story is Saved!' : 'Your Movie is Ready!'}
          </h1>
          <p className="text-xl text-gray-700">
            {errorMessage ? 'Your story has been recorded. Check back soon for your animation!' : 'Watch your SDG animation below'}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-2xl p-8 mb-6"
        >
          {/* Storyboard Title */}
          {videoData?.storyboard?.title && (
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {videoData.storyboard.title}
            </h2>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg"
            >
              <p className="text-yellow-800 mb-2">
                <strong>Note:</strong> {errorMessage}
              </p>
              {videoData?.details && (
                <details className="mt-2">
                  <summary className="text-yellow-700 text-sm cursor-pointer hover:text-yellow-900">
                    Show technical details
                  </summary>
                  <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-auto">
                    {videoData.details}
                  </pre>
                </details>
              )}
              <p className="text-yellow-700 text-sm mt-2">
                💡 Check the server console (where you ran npm run dev) for detailed error logs.
              </p>
            </motion.div>
          )}

          {/* Debug Info - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
              <strong>Debug Info:</strong>
              <ul className="mt-2 space-y-1">
                <li>videoData exists: {videoData ? 'Yes' : 'No'}</li>
                <li>Scenes count: {videoData?.scenes?.length || 0}</li>
                <li>Storyboard exists: {videoData?.storyboard ? 'Yes' : 'No'}</li>
                {videoData?.scenes && videoData.scenes.length > 0 && (
                  <li>First scene URL: {videoData.scenes[0].imageUrl ? 'Present' : 'Missing'}</li>
                )}
              </ul>
              <p className="mt-2 text-xs text-gray-600">
                💡 Check browser console (F12) for detailed logs
              </p>
            </div>
          )}

          {/* Generated Video or Scene Images */}
          {videoData?.video_url ? (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {videoData.is_merged ? 'Your 1-Minute Continuous Video' : 'Your Generated Animation Video'}
              </h3>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border-2 border-purple-200 rounded-lg overflow-hidden"
              >
                <div className="relative w-full aspect-video bg-gray-100">
                  <video
                    src={videoData.video_url}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      try {
                        console.error('Video failed to load:', videoData.video_url)
                        console.error('Video error details:', e)
                        if (e.target) {
                          e.target.style.display = 'none'
                          if (e.target.parentElement) {
                            e.target.parentElement.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                <p class="mb-2">Video failed to load</p>
                                <p class="text-sm text-gray-400">URL: ${videoData.video_url}</p>
                                <a href="${videoData.video_url}" target="_blank" rel="noopener noreferrer" class="mt-2 text-blue-600 hover:underline">
                                  Try opening in new tab
                                </a>
                              </div>
                            `
                          }
                        }
                      } catch (err) {
                        console.error('Error handling video error:', err)
                      }
                    }}
                    onLoadedData={() => {
                      try {
                        console.log('Video loaded successfully:', videoData.video_url)
                      } catch (err) {
                        console.error('Error in video load handler:', err)
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                    <a href={videoData.video_url} download>Download the video</a>
                  </video>
                </div>
                {/* Download Button */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <a
                    href={videoData.video_url}
                    download
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-6 rounded-full hover:shadow-lg transition-shadow"
                  >
                    <span>⬇️</span>
                    <span>Download Video</span>
                  </a>
                  {videoData.is_merged && (
                    <p className="text-sm text-gray-600 mt-2">
                      ✅ This is a continuous 1-minute video with {videoData.scenes_count || 0} scenes merged together.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          ) : videoData?.scenes && videoData.scenes.length > 0 ? (
            <div className="space-y-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Animation Storyboard</h3>
              {videoData.scenes.map((scene, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  className="border-2 border-purple-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                    <h4 className="font-bold text-lg text-gray-800 mb-2">
                      Scene {scene.sceneNumber}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">{scene.description}</p>
                  </div>
                  <div className="relative w-full aspect-video bg-gray-100">
                    {scene.videoUrl ? (
                      <video
                        src={scene.videoUrl}
                        controls
                        className="w-full h-full"
                        onError={(e) => {
                          try {
                            console.error('Scene video failed to load:', scene.videoUrl)
                            if (e.target) {
                              e.target.style.display = 'none'
                              if (e.target.parentElement) {
                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Video failed to load</div>'
                              }
                            }
                          } catch (err) {
                            console.error('Error handling scene video error:', err)
                          }
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={`Scene ${scene.sceneNumber}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          try {
                            console.error('Image failed to load:', scene.imageUrl)
                            if (e.target) {
                              e.target.style.display = 'none'
                              if (e.target.parentElement) {
                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Image failed to load</div>'
                              }
                            }
                          } catch (err) {
                            console.error('Error handling image error:', err)
                          }
                        }}
                        onLoad={() => {
                          try {
                            console.log('Image loaded successfully:', scene.imageUrl)
                          } catch (err) {
                            console.error('Error in image load handler:', err)
                          }
                        }}
                      />
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Fallback: Video Placeholder if no images */
            <div className="relative bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-lg overflow-hidden mb-6 aspect-video flex items-center justify-center">
              <div className="text-center p-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  ⏳
                </motion.div>
                <p className="text-gray-600 font-semibold mb-2">Generating Images...</p>
                <p className="text-sm text-gray-500">
                  {videoData ? 
                    'The AI is creating your animation scenes. This may take a moment...' : 
                    'No video data available. Please go back and generate again.'}
                </p>
                {!videoData && (
                  <Link href="/studio" className="mt-4 inline-block">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-purple-600 text-white font-bold py-2 px-6 rounded-full"
                    >
                      Go to Studio
                    </motion.button>
                  </Link>
                )}
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 text-2xl">🎬</div>
              <div className="absolute bottom-4 left-4 text-2xl">✨</div>
            </div>
          )}

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Video Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-2">
                  <strong>Model:</strong> {videoData?.model || 'Luma Dream Machine'}
                </p>
                {videoData?.video_url && (
                  <div className="text-gray-700 mb-2">
                    <strong>Video URL:</strong>
                    <div className="mt-1">
                      <a 
                        href={videoData.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline break-all text-sm"
                      >
                        {videoData.video_url}
                      </a>
                    </div>
                    {videoData.is_merged && (
                      <p className="text-sm text-green-600 mt-1">
                        ✅ Merged continuous video ({videoData.scenes_count || 0} scenes combined)
                      </p>
                    )}
                  </div>
                )}
                <p className="text-gray-700 mb-2">
                  <strong>Style:</strong> 2D Animation with bright colors
                </p>
                {videoData?.storyboard?.summary && (
                  <p className="text-gray-700 mb-2">
                    <strong>Summary:</strong> {videoData.storyboard.summary}
                  </p>
                )}
                <p className="text-gray-700 mb-2">
                  <strong>Your Script:</strong>
                </p>
                <p className="text-sm text-gray-600 mt-2 italic bg-white p-3 rounded border-l-4 border-purple-500">
                  {userScript || 'No script available'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <Link href="/studio">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
            >
              Create Another Movie 🎬
            </motion.button>
          </Link>
          <Link href="/my-results">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
            >
              View All My Results 📋
            </motion.button>
          </Link>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
            >
              Back to Home 🏠
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Watermark */}
      <div className="fixed bottom-3 right-3 text-xs text-gray-500 opacity-60 pointer-events-none z-50">
        Made by Salma Abdalla
      </div>
    </div>
  )
}

