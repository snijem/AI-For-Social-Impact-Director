'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { analyzeScript } from '../../lib/scriptCheck'
import OriginalityMeter from '../../components/OriginalityMeter'
import AIPromptsPanel from '../../components/AIPromptsPanel'
import HeartsLives from '../../components/HeartsLives'
import { useAuth } from '../../contexts/AuthContext'

export default function Studio() {
  const [script, setScript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [integrityConfirmed, setIntegrityConfirmed] = useState(false)
  
  const [heartsRefreshTrigger, setHeartsRefreshTrigger] = useState(0)
  const [userLives, setUserLives] = useState(3) // Track user's lives
  
  const router = useRouter()
  
  // Get user from auth context - login required for video generation
  const auth = useAuth()
  const user = auth?.user || null
  const loading = auth?.loading || false

  // All hooks must be called before any conditional returns
  // Analyze script for originality
  const analysis = useMemo(() => {
    return analyzeScript(script)
  }, [script])

  // Redirect to login if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/studio')
    }
  }, [user, loading, router])

  // Restore script and checkbox state from localStorage on mount
  useEffect(() => {
    const savedScript = localStorage.getItem('studioScript')
    const savedIntegrity = localStorage.getItem('studioIntegrity')
    if (savedScript) {
      setScript(savedScript)
    }
    if (savedIntegrity === 'true') {
      setIntegrityConfirmed(true)
    }
  }, [])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if user is not authenticated (will redirect)
  if (!user) {
    return null
  }

  const statusMessages = [
    'Casting characters...',
    'Rendering scene 1...',
    'Rendering scene 2...',
    'Adding subtitles...',
    'Applying colors...',
    'Finalizing animation...',
  ]

  const handleGenerate = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        alert('Please log in to generate videos. 🔐')
        router.push('/login')
        return
      }

      // Check if user has remaining lives
      if (userLives <= 0) {
        alert('No lives remaining. You have used all 3 lives (each life = $2 budget).')
        return
      }

      if (script.trim().length < 60) {
        alert('Please write a longer script! At least 60 characters needed. 📝')
        return
      }

      if (!integrityConfirmed) {
        alert('Please confirm that this story reflects your own ideas before generating. ✍️')
        return
      }

      setIsGenerating(true)
      setProgress(0)
      setStatusMessage('Creating generation job...')
    } catch (error) {
      console.error('Error in handleGenerate setup:', error)
      setIsGenerating(false)
      alert('An error occurred. Please try again.')
      return
    }

    // Simulate progress while API call is in progress
    let currentProgress = 0
    let messageIndex = 0
    let progressInterval = null
    
    try {
      progressInterval = setInterval(() => {
        try {
          currentProgress = Math.min(currentProgress + Math.random() * 10 + 3, 90) // Cap at 90% until API responds
          setProgress(currentProgress)
          
          // Update status message based on progress
          const newMessageIndex = Math.floor((currentProgress / 100) * statusMessages.length)
          if (newMessageIndex !== messageIndex && newMessageIndex < statusMessages.length) {
            messageIndex = newMessageIndex
            setStatusMessage(statusMessages[messageIndex])
          }
        } catch (err) {
          console.error('Error in progress interval:', err)
        }
      }, 300)
    } catch (error) {
      console.error('Error setting up progress interval:', error)
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }

    try {
      // Step 1: Create job (returns immediately with jobId) - NO TIMEOUT
      const createResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        
        // Handle no lives remaining error
        if (createResponse.status === 403 && errorData.error?.includes('No lives remaining')) {
          alert('No lives remaining. You have used all 3 lives (each life = $2 budget).')
          setIsGenerating(false)
          // Refresh lives display
          setHeartsRefreshTrigger(prev => prev + 1)
          return
        }
        
        throw new Error(errorData.error || 'Failed to create generation job')
      }

      const createData = await createResponse.json()
      const jobId = createData.jobId

      if (!jobId) {
        throw new Error('No job ID returned from server')
      }

      console.log('[Studio] Job created:', jobId)
      setStatusMessage('Job created. Starting generation...')

      // Step 2: Poll job status every 2 seconds (NO TIMEOUT on fetch)
      let pollInterval = null
      let pollAttempts = 0
      const maxPollAttempts = 600 // 20 minutes max

      const pollJobStatus = async () => {
        try {
          pollAttempts++
          
          if (pollAttempts > maxPollAttempts) {
            clearInterval(pollInterval)
            throw new Error('Generation timeout - took too long')
          }

          const statusResponse = await fetch(`/api/job/${jobId}`)
          
          if (!statusResponse.ok) {
            if (statusResponse.status === 404) {
              throw new Error('Job not found')
            }
            const errorData = await statusResponse.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to get job status')
          }

          const jobData = await statusResponse.json()
          
          // Update progress
          setProgress(jobData.progress || 0)
          setStatusMessage(jobData.currentStep || `Status: ${jobData.status}`)

          // Check if job is complete
          if (jobData.status === 'completed') {
            clearInterval(pollInterval)
            
            // Build result data - use merged video URL (single continuous video)
            const mergedVideoUrl = jobData.results?.merged_video_url || jobData.results?.video_url || null
            
            console.log('[Studio] Merged video URL:', mergedVideoUrl)
            console.log('[Studio] Job results:', jobData.results)
            
            const resultData = {
              id: jobId,
              status: 'completed',
              script: script,
              storyboard: jobData.results?.storyboard || null,
              // For continuous video: show only merged video, not individual clips
              scenes: [], // Hide individual scenes from user
              model: 'luma-dream-machine',
              created_at: jobData.createdAt || new Date().toISOString(),
              video_url: mergedVideoUrl, // Single merged video URL - CRITICAL for result page
              generation_id: jobId, // Use jobId as generation ID
              scenes_count: jobData.results?.scenes_count || 0,
              is_merged: true, // Flag indicating this is a merged continuous video
            }
            
            console.log('[Studio] Final result data:', resultData)

            // Save to database
            if (user) {
              try {
                await fetch('/api/videos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    script: script,
                    videoUrl: resultData.video_url,
                    generationId: resultData.generation_id,
                    status: 'completed',
                    storyboard: resultData.storyboard,
                    videoData: resultData,
                  }),
                })
              } catch (dbError) {
                console.error('Error saving to database:', dbError)
              }
            }

            sessionStorage.setItem('userScript', script)
            sessionStorage.setItem('videoData', JSON.stringify(resultData))
            sessionStorage.removeItem('errorMessage')

            setProgress(100)
            setStatusMessage('Generation complete!')
            
            // Decrement lives after successful generation
            if (user) {
              try {
                const livesResponse = await fetch('/api/user/lives', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ decrement: 1 }),
                })
                
                if (livesResponse.ok) {
                  const livesData = await livesResponse.json()
                  setUserLives(livesData.lives_remaining)
                  setHeartsRefreshTrigger(prev => prev + 1)
                }
              } catch (livesError) {
                console.error('Error decrementing lives:', livesError)
                // Don't block the result page if lives decrement fails
              }
            }
            
            setTimeout(() => {
              setIsGenerating(false)
              router.push('/result')
            }, 500)

          } else if (jobData.status === 'failed') {
            clearInterval(pollInterval)
            const errorMsg = jobData.error || 'Generation failed'
            
            if (user) {
              try {
                await fetch('/api/videos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    script: script,
                    videoUrl: null,
                    generationId: null,
                    status: 'failed',
                    storyboard: jobData.results?.storyboard || null,
                    videoData: { status: 'error', error: errorMsg },
                  }),
                })
              } catch (dbError) {
                console.error('Error saving to database:', dbError)
              }
            }

            sessionStorage.setItem('userScript', script)
            sessionStorage.setItem('errorMessage', errorMsg)
            sessionStorage.setItem('videoData', JSON.stringify({
              status: 'error',
              script: script,
              error: errorMsg,
              storyboard: jobData.results?.storyboard || null,
            }))

            setIsGenerating(false)
            alert(`Generation failed: ${errorMsg}`)
            router.push('/result')
          }
        } catch (pollError) {
          console.error('[Studio] Poll error:', pollError)
          clearInterval(pollInterval)
          setIsGenerating(false)
          alert(`Error checking job status: ${pollError.message}`)
        }
      }

      // Start polling
      await pollJobStatus()
      pollInterval = setInterval(pollJobStatus, 2000)
    } catch (error) {
      try {
        if (progressInterval) {
          clearInterval(progressInterval)
        }
      } catch (clearError) {
        console.error('Error clearing interval:', clearError)
      }
      console.error('Error generating video:', error)
      
      // Handle static export mode gracefully (API routes don't exist)
      const isStaticExport = error.message === 'STATIC_EXPORT_MODE' || 
                            error.message.includes('Failed to fetch') || 
                            error.message.includes('404') ||
                            error.name === 'TypeError'
      
      if (isStaticExport) {
        // Create a mock response for static export - saves the story gracefully
        const mockData = {
          id: `video_${Date.now()}`,
          status: 'saved',
          script: script,
          storyboard: {
            title: script.split('\n')[0] || 'SDG Animation',
            summary: script.substring(0, 200),
            scenes: [
              {
                sceneNumber: 1,
                description: script.substring(0, 300),
                duration: 120,
                visualStyle: '2D animation with bright colors'
              }
            ]
          },
          scenes: [],
          model: 'luma-dream-machine',
          created_at: new Date().toISOString(),
          video_url: null,
          generation_id: null,
        }
        
        setProgress(100)
        
        // Save to database if user is logged in
        if (user) {
          try {
            await fetch('/api/videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                script: script,
                videoUrl: null,
                generationId: null,
                status: 'draft',
                storyboard: mockData.storyboard,
                videoData: mockData,
              }),
            })
          } catch (dbError) {
            console.error('Error saving to database:', dbError)
          }
        }
        
        setTimeout(() => {
          setIsGenerating(false)
          
          sessionStorage.setItem('userScript', script)
          sessionStorage.setItem('videoData', JSON.stringify(mockData))
          sessionStorage.setItem('errorMessage', 'Your story has been saved successfully! Video generation requires server-side functionality. Your script is ready for review.')
          router.push(`/result`)
        }, 500)
      } else {
        // On other errors, still go to result page but store error message
        setProgress(100)
        
        // Save to database if user is logged in
        if (user) {
          try {
            await fetch('/api/videos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                script: script,
                videoUrl: null,
                generationId: null,
                status: 'failed',
                storyboard: null,
                videoData: { status: 'error', error: error.message },
              }),
            })
          } catch (dbError) {
            console.error('Error saving to database:', dbError)
          }
        }
        
        setTimeout(() => {
          setIsGenerating(false)
          
          const errorMsg = error.message || 'Video generation is in progress or failed. Your story has been saved!';
          sessionStorage.setItem('userScript', script)
          sessionStorage.setItem('errorMessage', errorMsg)
          sessionStorage.setItem('videoData', JSON.stringify({
            status: 'error',
            script: script,
            error: errorMsg,
            details: error.message
          }))
          router.push(`/result`)
        }, 500)
      }
    }
  }


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background pattern with camera emojis */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid grid-cols-8 gap-4 p-8 text-4xl">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01, duration: 0.5 }}
              className="text-center"
            >
              {i % 2 === 0 ? '📷' : '🎥'}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-2"
            >
              ← Back to Home
            </motion.button>
          </Link>
          <Link href="/my-results">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
            >
              <span>📋</span>
              <span>My Results</span>
            </motion.button>
          </Link>
          <Link href="/ai-prompts">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2"
            >
              <span>🤖</span>
              <span>AI - Prompts</span>
            </motion.button>
          </Link>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          Script Studio 🎬
        </motion.h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Script Input Area */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Script</h2>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={`Write your story here...

Example:
Once upon a time, in a small coastal village, the ocean was filled with plastic waste. Maria, a young student, noticed that sea turtles were getting sick. She decided to organize a beach cleanup with her friends. Together, they collected hundreds of plastic bottles and created art from them. The whole village joined in, and soon the ocean was clean again. The sea turtles returned, and Maria learned that one person can make a big difference.

Your story should include:
• A clear SDG theme (like clean oceans, climate action, or ending poverty)
• Characters that students can relate to
• A problem that needs solving
• An inspiring solution or message
• A setting that brings the story to life
• A hopeful ending

Write your story below:`}
                className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none text-gray-700 font-sans leading-relaxed"
              />
              
              {/* Originality Checker */}
              {script.length > 0 && (
                <div className="mt-4">
                  <OriginalityMeter 
                    score={analysis.score} 
                    flags={analysis.flags} 
                    suggestions={analysis.suggestions} 
                  />
                </div>
              )}

              {/* Integrity Checkbox */}
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrityConfirmed}
                    onChange={(e) => setIntegrityConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>I confirm this story reflects my own ideas</strong> (AI can help, but I directed it).
                  </span>
                </label>
              </div>
              
              <div className="mt-4 flex flex-col gap-3">
                {/* Login Required Message */}
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔒</span>
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-800 mb-1">
                          Login Required
                        </p>
                        <p className="text-sm text-yellow-700 mb-2">
                          Please log in to generate videos. Your videos will be saved to your account.
                        </p>
                        <Link href="/login">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                          >
                            Go to Login →
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {script.length} characters
                  </span>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerate}
                      disabled={!user || isGenerating || !integrityConfirmed || userLives <= 0}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !user 
                          ? 'Please log in to generate videos' 
                          : userLives <= 0 
                            ? 'No lives remaining. You have used all 3 lives (each life = $2 budget).' 
                            : ''
                      }
                    >
                      {isGenerating ? 'Generating...' : userLives <= 0 ? 'No Lives Remaining ❌' : 'Generate (9s) ✨'}
                    </motion.button>
                  </div>
                </div>
                
                {/* Lives display before generation */}
                {user && (
                  <div className="text-xs text-gray-600 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Lives:</span>
                      <HeartsLives refreshTrigger={heartsRefreshTrigger} />
                    </div>
                    <span className="text-gray-500 text-xs">Each life = $2 budget</span>
                  </div>
                )}

              </div>
            </motion.div>
          </div>

          {/* AI Tips Panel */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Storytelling Tips 💡</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">📖</span>
                  <span><strong>Create characters</strong> with names and personalities</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🌍</span>
                  <span><strong>Set the scene</strong> - where does your story happen?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⚡</span>
                  <span><strong>Show the problem</strong> - what needs to be fixed?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💪</span>
                  <span><strong>Describe the action</strong> - what do characters do?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">❤️</span>
                  <span><strong>Add emotions</strong> - how do people feel?</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✨</span>
                  <span><strong>End with hope</strong> - show positive change</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎯</span>
                  <span><strong>Connect to SDGs</strong> - which goal does it address?</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Storytelling Tips:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Start with "Once upon a time..." or "In a world where..."</li>
                  <li>• Give your characters names</li>
                  <li>• Describe what they see, feel, and do</li>
                  <li>• Show the problem clearly</li>
                  <li>• End with hope and action</li>
                </ul>
              </div>
            </motion.div>
            
            {/* AI Prompts Panel */}
            <AIPromptsPanel />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-8 max-w-md w-full mx-4"
            >
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">
                AI Generating...
              </h3>
              
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-center mt-2 text-gray-600">{Math.round(progress)}%</p>
              </div>
              
              <motion.p
                key={statusMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-lg text-gray-700"
              >
                {statusMessage}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Watermark */}
      <div className="fixed bottom-3 right-3 text-xs text-gray-500 opacity-60 pointer-events-none z-50">
        Made by Salma Abdalla
      </div>
    </div>
  )
}

