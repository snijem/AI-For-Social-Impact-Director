'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import HeartsLives from '../../components/HeartsLives'

// SDG Prompt Templates
const sdgPrompts = [
  {
    id: 1,
    title: "The Empty Hand",
    sdg: "SDG 1: No Poverty",
    bestFor: "Hope / Transformation",
    beatPlan: "0–3s: Empty hands reach up / 3–6s: Community forms around / 6–9s: Hands fill with resources",
    basePrompt: `A cinematic single-shot scene of {SUBJECT} with empty hands reaching upward in a {SETTING}, warm golden hour lighting.
The camera slowly pushes forward as community members join, placing resources into the outstretched hands.
One natural action only, subtle micro-movements, realistic human motion, soft depth of field, hopeful atmosphere.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 2,
    title: "The First Bite",
    sdg: "SDG 2: Zero Hunger",
    bestFor: "Satisfaction / Nourishment",
    beatPlan: "0–3s: Hungry child looks at empty plate / 3–6s: Food appears on plate / 6–9s: First bite with smile",
    basePrompt: `A cinematic single-shot scene of {SUBJECT} sitting at a table in {SETTING}, soft natural lighting.
The camera slowly pans from empty plate to plate filling with food, then child takes first bite.
One natural action only, subtle micro-movements, realistic hand motion, warm colors, joyful atmosphere.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 3,
    title: "The Healing Touch",
    sdg: "SDG 3: Good Health & Well-Being",
    bestFor: "Care / Recovery",
    beatPlan: "0–3s: Unwell person in bed / 3–6s: Caregiver approaches / 6–9s: Gentle hand on shoulder, hope returns",
    basePrompt: `A cinematic single-shot scene of {SUBJECT} resting in a {SETTING}, soft diffused lighting.
The camera slowly tilts up as a caregiver approaches and places a gentle hand on shoulder.
One natural action only, subtle micro-movements, realistic body motion, calming atmosphere, soft focus.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 4,
    title: "The Open Book",
    sdg: "SDG 4: Quality Education",
    bestFor: "Discovery / Learning",
    beatPlan: "0–3s: Closed book on desk / 3–6s: Hand opens book / 6–9s: Light shines on pages, eyes light up",
    basePrompt: `A cinematic single-shot scene of a closed book on a desk in {SETTING}, soft desk lamp lighting.
The camera slowly zooms in as {SUBJECT}'s hand opens the book, pages reveal, light illuminates content.
One natural action only, subtle micro-movements, realistic hand motion, magical atmosphere, warm colors.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 5,
    title: "The Equal Handshake",
    sdg: "SDG 5: Gender Equality",
    bestFor: "Unity / Respect",
    beatPlan: "0–3s: Two hands approach from opposite sides / 3–6s: Hands meet in center / 6–9s: Firm equal handshake",
    basePrompt: `A cinematic single-shot scene of two hands approaching from opposite sides in {SETTING}, balanced natural lighting.
The camera slowly pushes in as hands meet in the center for a firm, equal handshake.
One natural action only, subtle micro-movements, realistic hand motion, empowering atmosphere, even composition.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 6,
    title: "The Flowing Drop",
    sdg: "SDG 6: Clean Water & Sanitation",
    bestFor: "Purity / Life",
    beatPlan: "0–3s: Single drop falls into clear water / 3–6s: Ripples spread outward / 6–9s: Reflection shows clean source",
    basePrompt: `A cinematic single-shot scene of a single water drop falling into clear water in {SETTING}, bright natural lighting.
The camera slowly follows the drop down, ripples form and spread, reflection shows clean water source.
One natural action only, subtle micro-movements, realistic fluid motion, refreshing atmosphere, cool blue tones.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 7,
    title: "The Solar Glow",
    sdg: "SDG 7: Affordable & Clean Energy",
    bestFor: "Innovation / Progress",
    beatPlan: "0–3s: Solar panel in shadow / 3–6s: Sunlight hits panel / 6–9s: Light bulb illuminates",
    basePrompt: `A cinematic single-shot scene of a solar panel in {SETTING}, transitioning from shadow to sunlight.
The camera slowly pulls back as sunlight hits the panel, energy flows to a light bulb that illuminates.
One natural action only, subtle micro-movements, realistic light transition, inspiring atmosphere, warm-to-bright shift.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 8,
    title: "The Circle of Inclusion",
    sdg: "SDG 10: Reduced Inequalities",
    bestFor: "Unity / Acceptance",
    beatPlan: "0–3s: Person alone outside circle / 3–6s: Circle opens / 6–9s: Person welcomed inside",
    basePrompt: `A cinematic single-shot scene of {SUBJECT} standing alone outside a circle of people in {SETTING}, balanced lighting.
The camera slowly circles around as the group opens, welcoming the person into the circle.
One natural action only, subtle micro-movements, realistic body motion, inclusive atmosphere, harmonious colors.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 9,
    title: "The Circular Choice",
    sdg: "SDG 12: Responsible Consumption & Production",
    bestFor: "Awareness / Change",
    beatPlan: "0–3s: Disposable item in hand / 3–6s: Hand hesitates / 6–9s: Switches to reusable alternative",
    basePrompt: `A cinematic single-shot scene of {SUBJECT} holding a disposable item in {SETTING}, clear natural lighting.
The camera slowly pushes in as the hand hesitates, then reaches for a reusable alternative instead.
One natural action only, subtle micro-movements, realistic hand motion, conscious atmosphere, earthy tones.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  },
  {
    id: 10,
    title: "The Seed of Tomorrow",
    sdg: "SDG 13: Climate Action",
    bestFor: "Hope / Regeneration",
    beatPlan: "0–3s: Barren ground / 3–6s: Hand plants seed / 6–9s: Green sprout emerges",
    basePrompt: `A cinematic single-shot scene of barren ground in {SETTING}, muted lighting transitioning to warm.
The camera slowly zooms in as {SUBJECT}'s hand plants a seed, and a green sprout pushes through soil.
One natural action only, subtle micro-movements, realistic plant motion, regenerative atmosphere, color shift to green.
Single continuous shot, stable composition, no looping, no repeated gestures, no flicker.`,
    antiGlitch: `Stable composition, consistent lighting, realistic motion, no flicker, no distortion, no duplicated limbs, no looping, no sudden transitions, no camera jitter, single natural action only, no repeated motion cycles.`
  }
]

export default function SDGMoviePromptsPage() {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [script, setScript] = useState('')
  
  // Video generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [userLives, setUserLives] = useState(3)
  const [userPoints, setUserPoints] = useState(300) // Points: 1 life = 100 points
  const [livesLoading, setLivesLoading] = useState(true)
  const [heartsRefreshTrigger, setHeartsRefreshTrigger] = useState(0)
  const [abortController, setAbortController] = useState(null)
  const [livesDecremented, setLivesDecremented] = useState(false) // Guard to prevent multiple decrements

  const router = useRouter()
  const auth = useAuth()
  const user = auth?.user || null
  const loading = auth?.loading || false

  // Fetch user lives and points on mount and when user changes
  useEffect(() => {
    if (user) {
      setLivesLoading(true)
      fetch('/api/user/lives')
        .then(res => res.json())
        .then(data => {
          if (data.lives_remaining !== undefined) {
            setUserLives(data.lives_remaining)
          }
          if (data.points_remaining !== undefined) {
            setUserPoints(data.points_remaining)
          } else if (data.lives_remaining !== undefined) {
            // Fallback: calculate points from lives
            setUserPoints(data.lives_remaining * 100)
          }
          setLivesLoading(false)
        })
        .catch(err => {
          console.error('Error fetching lives:', err)
          setLivesLoading(false)
        })
    } else {
      setLivesLoading(false)
    }
  }, [user, heartsRefreshTrigger])

  // Restore script from localStorage
  useEffect(() => {
    const savedScript = localStorage.getItem('studioScript')
    if (savedScript) {
      setScript(savedScript)
    }
  }, [])

  // Save script to localStorage on change
  useEffect(() => {
    if (script) {
      localStorage.setItem('studioScript', script)
    }
  }, [script])

  const replacePlaceholders = (text) => {
    return text
      .replace(/{SUBJECT}/g, 'a young person')
      .replace(/{SETTING}/g, 'a community space')
  }

  const handleCopyPrompt = async (prompt, index) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleGenerate = async () => {
    try {
      if (!user) {
        alert('Please log in to generate your video. 🔐')
        router.push('/login?redirect=/sdg-movie-prompts')
        return
      }

      if (script.trim().length < 2) {
        alert('Please write a script! At least 2 characters needed. 📝')
        return
      }

      // Check points (100 points = 1 life, need at least 100 points to generate)
      const COST_PER_VIDEO = 100
      if (userPoints < COST_PER_VIDEO) {
        alert(`Insufficient points! You need ${COST_PER_VIDEO} points to generate a video. You have ${userPoints}/300 points remaining.`)
        return
      }

      // Create abort controller for cancellation
      const controller = new AbortController()
      setAbortController(controller)

      setIsGenerating(true)
      setProgress(0)
      setStatusMessage('Creating generation job...')

      // Step 1: Create generation job
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
        signal: controller.signal,
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        if (generateResponse.status === 403) {
          alert('No lives remaining! You have used all 3 lives.')
          setHeartsRefreshTrigger(prev => prev + 1)
          return
        }
        throw new Error(errorData.error || 'Failed to create generation job')
      }

      const { jobId } = await generateResponse.json()
      setStatusMessage('Job created! Processing video...')
      setProgress(10)

      // Reset lives decremented flag for new generation
      setLivesDecremented(false)

      // Step 2: Poll for job status
      let pollAttempts = 0
      const maxPollAttempts = 240 // 20 minutes max (240 * 5 seconds)
      let lastProgress = 10

      const pollInterval = setInterval(async () => {
        if (pollAttempts >= maxPollAttempts) {
          clearInterval(pollInterval)
          setIsGenerating(false)
          alert('Generation timed out. Please try again.')
          return
        }

        pollAttempts++

        try {
          const statusResponse = await fetch(`/api/job/${jobId}`, {
            signal: controller.signal,
          })

          if (!statusResponse.ok) {
            throw new Error('Failed to fetch job status')
          }

          const jobData = await statusResponse.json()

          // Update progress
          const jobProgress = jobData.progress || lastProgress
          if (jobProgress > lastProgress) {
            lastProgress = jobProgress
            setProgress(jobProgress)
          }

          // Handle both currentStep and current_step for compatibility
          const statusMsg = jobData.currentStep || jobData.current_step || `Processing... ${jobProgress}%`
          setStatusMessage(statusMsg)

          // Check if completed
          if (jobData.status === 'completed') {
            clearInterval(pollInterval)
            setProgress(100)
            setStatusMessage('Video generation complete!')

            // Extract video URL from results object
            const videoUrl = jobData.results?.video_url || jobData.results?.merged_video_url || jobData.video_url
            const storyboard = jobData.results?.storyboard || jobData.storyboard

            if (!videoUrl) {
              clearInterval(pollInterval)
              setIsGenerating(false)
              alert('Video generation completed but no video URL was returned. Please check the server logs.')
              return
            }

            // Decrement points only once (guard against multiple calls)
            // Each video costs 100 points (1 life)
            if (!livesDecremented) {
              setLivesDecremented(true)
              try {
                const livesResponse = await fetch('/api/user/lives', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ decrement_points: 100 }), // Cost: 100 points per video
                })
                
                if (livesResponse.ok) {
                  const livesData = await livesResponse.json()
                  setUserLives(livesData.lives_remaining || 0)
                  setUserPoints(livesData.points_remaining || 0)
                  setHeartsRefreshTrigger(prev => prev + 1)
                  console.log(`Points deducted: ${livesData.points_deducted || 100}, Remaining: ${livesData.points_remaining || 0}/300`)
                } else {
                  console.error('Failed to decrement points:', await livesResponse.text())
                }
              } catch (livesError) {
                console.error('Error decrementing points:', livesError)
              }
            }

            // Save to sessionStorage and redirect
            sessionStorage.setItem('userScript', script)
            sessionStorage.setItem('videoData', JSON.stringify({
              video_url: videoUrl,
              script: script,
              storyboard: storyboard,
              scenes_count: jobData.results?.scenes_count || jobData.scenesCount || 1,
              is_merged: true,
              status: 'completed',
            }))

            setTimeout(() => {
              router.push('/result')
            }, 1000)
          } else if (jobData.status === 'failed') {
            clearInterval(pollInterval)
            setIsGenerating(false)
            const errorMsg = jobData.error || jobData.errorDetails?.error || 'Unknown error'
            alert(`Generation failed: ${errorMsg}`)
          }
        } catch (pollError) {
          if (pollError.name === 'AbortError') {
            clearInterval(pollInterval)
            return
          }
          console.error('Polling error:', pollError)
        }
      }, 5000) // Poll every 5 seconds

      // Store interval for cleanup
      setAbortController(controller)

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Generation cancelled')
        return
      }
      console.error('Error generating video:', error)
      alert(`Failed to generate video: ${error.message}`)
      setIsGenerating(false)
    }
  }

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsGenerating(false)
    setProgress(0)
    setStatusMessage('')
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center flex-wrap gap-4"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-2"
            >
              ← Back to Home
            </motion.button>
          </Link>
          <Link href="/studio">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              My Script 🎬
            </motion.button>
          </Link>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8 md:p-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent">
            SDG Movie Prompts (9s)
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Professional prompt pack. Each prompt is optimized for a 9-second continuous shot with minimal glitches.
          </p>

          {/* Script Input Section */}
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 md:p-8"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create Your 9s Movie 🎬
              </h2>
              
              {/* Guide Section */}
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-l-4 border-purple-500">
                <h3 className="text-xl font-bold mb-4 text-gray-800">📖 Writing Guide</h3>
                <div className="space-y-3 text-gray-700">
                  <div>
                    <p className="font-semibold mb-2">Your story should include:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>A clear SDG theme</strong> (like clean oceans, climate action, ending poverty, or water conservation)</li>
                      <li><strong>Characters</strong> that students can relate to (young people making a difference)</li>
                      <li><strong>A problem</strong> that needs solving (real-world issue connected to SDGs)</li>
                      <li><strong>An inspiring solution</strong> or action taken by the characters</li>
                      <li><strong>A setting</strong> that brings the story to life (school, community, nature, etc.)</li>
                      <li><strong>A hopeful ending</strong> showing positive change or impact</li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="font-semibold mb-2">💡 Tips for a great 9-second story:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Keep it simple and focused on one main idea</li>
                      <li>Show action and change happening (not just describing)</li>
                      <li>Make it visual - describe what we can see</li>
                      <li>Connect to real SDG goals that matter to you</li>
                      <li>End with hope, inspiration, or a clear message</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Direct your 9s movie sentence */}
              <div className="mb-6 text-center">
                <p className="text-lg font-semibold text-gray-800 italic">
                  Direct your 9s movie, learn how to summerize your story
                </p>
              </div>

              {/* AI Prompts Examples */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">🤖 AI Prompts Examples:</p>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Example 1 - Clean Oceans:</p>
                    <p className="text-xs text-gray-700 font-mono leading-relaxed">
                      "A cinematic single-shot scene of a young person picking up plastic bottles on a beach at sunset, warm golden hour lighting. The camera slowly pushes forward as more community members join, filling bags with waste. Realistic human motion, soft depth of field, hopeful atmosphere. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts."
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-green-500">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Example 2 - Climate Action:</p>
                    <p className="text-xs text-gray-700 font-mono leading-relaxed">
                      "A cinematic single-shot scene of a young person planting a tree sapling in dry cracked soil, warm natural lighting. The camera slowly zooms in as the sapling grows and green leaves appear. Realistic plant motion, soft depth of field, cinematic color grading, hopeful atmosphere. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts."
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Example 3 - Zero Hunger:</p>
                    <p className="text-xs text-gray-700 font-mono leading-relaxed">
                      "A cinematic single-shot scene of a young person sharing food with others at a community table, soft natural lighting. The camera slowly pans as plates fill with nutritious meals and smiles appear. Realistic human motion, cinematic depth of field, warm atmosphere. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts."
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 text-gray-800">Your Script 📝</h3>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Write your story here... Start with your character and setting, then describe the problem, the action taken, and the positive outcome."
                className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none text-gray-700 font-sans leading-relaxed"
              />
              
              {/* Character count, Lives, and Generate button */}
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {script.length} characters
                  </span>
                  {user && (
                    <div className="flex items-center gap-2">
                      <HeartsLives refreshTrigger={heartsRefreshTrigger} />
                    </div>
                  )}
                </div>
                
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔒</span>
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-800 mb-1">Login Required</p>
                        <p className="text-sm text-yellow-700 mb-2">
                          Please log in to generate your video.
                        </p>
                        <Link href="/login?redirect=/sdg-movie-prompts">
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerate}
                  disabled={!user || isGenerating || livesLoading || userPoints < 100}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !user 
                      ? 'Please log in to generate your video'
                      : livesLoading
                      ? 'Loading points...'
                      : userPoints < 100
                      ? `Insufficient points. You need 100 points to generate a video. You have ${userPoints}/300 points.`
                      : ''
                  }
                >
                  {isGenerating ? 'Generating...' : 'Generate (9s) ✨'}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* How to Win Section */}
          <div className="mb-10 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">How to Win in 9 Seconds</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Start strong (0–3s):</strong> Set up your scene clearly—one subject, one action, one setting</li>
              <li>• <strong>Build momentum (3–6s):</strong> Show the change happening—make it visible and emotional</li>
              <li>• <strong>End with impact (6–9s):</strong> Leave viewers feeling something—hope, inspiration, or understanding</li>
              <li>• <strong>Keep it simple:</strong> One continuous shot, one camera move, one clear story beat</li>
              <li>• <strong>Connect to SDG:</strong> Make the goal obvious but not preachy—show, don't tell</li>
            </ul>
          </div>

          {/* Prompt Templates */}
          <div className="space-y-8">
            {sdgPrompts.map((prompt) => {
              const fullPrompt = replacePlaceholders(prompt.basePrompt) + ' ' + prompt.antiGlitch

              return (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prompt.id * 0.1 }}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 transition-colors"
                >
                  <h2 className="text-3xl font-bold mt-4 mb-4 text-gray-800">
                    🎬 Prompt {prompt.id} — "{prompt.title}"
                  </h2>
                  
                  <div className="space-y-3 mb-4">
                    <p className="text-gray-700"><strong>SDG:</strong> {prompt.sdg}</p>
                    <p className="text-gray-700"><strong>Best for:</strong> {prompt.bestFor}</p>
                    <p className="text-gray-700"><strong>9s Beat Plan:</strong> {prompt.beatPlan}</p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Base Prompt (paste into Luma):</p>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{replacePlaceholders(prompt.basePrompt)}</code>
                        </pre>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopyPrompt(replacePlaceholders(prompt.basePrompt), `${prompt.id}-base`)}
                          className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                          {copiedIndex === `${prompt.id}-base` ? '✓ Copied!' : '📋 Copy'}
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Anti-glitch Add-On (append at the end):</p>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{prompt.antiGlitch}</code>
                        </pre>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopyPrompt(prompt.antiGlitch, `${prompt.id}-anti`)}
                          className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                          {copiedIndex === `${prompt.id}-anti` ? '✓ Copied!' : '📋 Copy'}
                        </motion.button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Copy-ready Full Prompt:</p>
                      <div className="relative">
                        <pre className="bg-gradient-to-br from-purple-900 to-blue-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{fullPrompt}</code>
                        </pre>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopyPrompt(fullPrompt, `${prompt.id}-full`)}
                          className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                          {copiedIndex === `${prompt.id}-full` ? '✓ Copied!' : '📋 Copy Full'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Common Glitch Fixes */}
          <div className="mt-10 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-l-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Common Glitch Fixes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3 text-gray-700">
                <p>1. <strong>Flickering:</strong> Add "consistent lighting" and "no flicker"</p>
                <p>2. <strong>Looping motion:</strong> Specify "one natural action only" and "no repeated motion cycles"</p>
                <p>3. <strong>Duplicated limbs:</strong> Use "no duplicated limbs" and "realistic human motion"</p>
              </div>
              <div className="space-y-3 text-gray-700">
                <p>4. <strong>Camera shake:</strong> Add "stable composition" and "no camera jitter"</p>
                <p>5. <strong>Sudden transitions:</strong> Specify "no sudden transitions" and "smooth camera movement"</p>
                <p>6. <strong>Distortion:</strong> Include "no distortion" and "realistic motion"</p>
              </div>
            </div>
          </div>

          {/* Judge Rubric */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Judge Rubric</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Criteria</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-800">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">Idea clarity in 9s</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">30</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">SDG relevance</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">25</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">Visual stability</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">20</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">Emotion/Impact</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">15</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">Creativity</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">10</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Generation Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"
              />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Generating Your 9s Video</h3>
              <p className="text-gray-600">{statusMessage || 'Processing...'}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">{progress}%</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopGeneration}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Cancel Generation
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

