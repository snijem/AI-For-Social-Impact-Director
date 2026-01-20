'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { analyzeScript } from '../../lib/scriptCheck'
import OriginalityMeter from '../../components/OriginalityMeter'
import AIPromptsPanel from '../../components/AIPromptsPanel'
import { useAuth } from '../../contexts/AuthContext'

export default function Studio() {
  const [script, setScript] = useState('')
  const [isSubmittingScript, setIsSubmittingScript] = useState(false)
  const [integrityConfirmed, setIntegrityConfirmed] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  
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

  const handleSubmitScript = async () => {
    try {
      if (!user) {
        alert('Please log in to submit your script. 🔐')
        router.push('/login?redirect=/studio')
        return
      }

      if (script.trim().length < 2) {
        alert('Please write a script! At least 2 characters needed. 📝')
        return
      }

      if (!integrityConfirmed) {
        alert('Please confirm that this story reflects your own ideas before submitting. ✍️')
        return
      }

      setIsSubmittingScript(true)

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || 'Failed to submit script'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Clear the form
      setScript('')
      setIntegrityConfirmed(false)
      localStorage.removeItem('studioScript')
      localStorage.removeItem('studioIntegrity')
      
      // Show success banner
      setShowSuccessBanner(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/sdg-movie-prompts')
      }, 2000)

    } catch (error) {
      console.error('Error submitting script:', error)
      alert(`Failed to submit script: ${error.message}`)
    } finally {
      setIsSubmittingScript(false)
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
        <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-2"
            >
              ← Back to Home
            </motion.button>
          </Link>
          <div className="flex gap-3 flex-wrap">
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
            <Link href="/sdg-movie-prompts">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                Create your 9s Movie
              </motion.button>
            </Link>
          </div>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          Writing Skills 🎬
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
                      onClick={handleSubmitScript}
                      disabled={!user || isSubmittingScript || !integrityConfirmed}
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !user 
                          ? 'Please log in to submit your script' 
                          : ''
                      }
                    >
                      {isSubmittingScript ? 'Submitting...' : 'Submit Script 📤'}
                    </motion.button>
                  </div>
                </div>
                
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
                  <span className="mr-2">🌟</span>
                  <span><strong>End with hope</strong> - show positive change</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✨</span>
                  <span><strong>Keep it simple</strong> - focus on one clear message</span>
                </li>
              </ul>
            </motion.div>
            
            {/* AI Prompts Panel */}
            <AIPromptsPanel />
          </div>
        </div>
      </div>

      {isSubmittingScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <p>Submitting script...</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-2xl p-6 text-white"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-4xl"
                >
                  ✅
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Success!</h3>
                  <p className="text-sm opacity-90">Your script has been submitted successfully!</p>
                  <p className="text-xs opacity-75 mt-1">Redirecting to Create your 9s Movie...</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
