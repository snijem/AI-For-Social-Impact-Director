 'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import RightCenterFloatingActions from '../components/RightCenterFloatingActions'

export default function Home() {
  const { user, logout } = useAuth()
  const [showNotes, setShowNotes] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isCountdownActive, setIsCountdownActive] = useState(true)

  // Countdown target: January 20, 2026, 12:00 PM Dubai time (UTC+4)
  useEffect(() => {
    // Dubai is UTC+4, so 12:00 PM Dubai = 08:00 UTC
    const targetDate = new Date('2026-01-20T08:00:00Z') // UTC time
    
    const updateCountdown = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setIsCountdownActive(false)
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* Light Earth Theme Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Soft green-blue background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50"></div>
        
        {/* Scattered earth emojis with animations */}
        <div className="absolute top-10 left-10 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4s' }}>🌍</div>
        <div className="absolute top-20 right-20 text-6xl md:text-7xl opacity-20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>🌎</div>
        <div className="absolute bottom-20 left-1/4 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}>🌏</div>
        <div className="absolute bottom-10 right-1/3 text-6xl md:text-7xl opacity-20 animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}>🌍</div>
        <div className="absolute top-1/3 right-10 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '2s' }}>🌎</div>
        <div className="absolute top-1/2 left-20 text-6xl md:text-7xl opacity-20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.8s' }}>🌏</div>
        <div className="absolute top-1/4 left-1/3 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4.2s', animationDelay: '1.2s' }}>🌍</div>
        <div className="absolute bottom-1/3 right-1/4 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4.8s', animationDelay: '0.3s' }}>🌎</div>
        <div className="absolute top-3/4 left-1/2 text-6xl md:text-7xl opacity-20 animate-bounce" style={{ animationDuration: '5.2s', animationDelay: '1.8s' }}>🌏</div>
        <div className="absolute top-1/5 right-1/2 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4.3s', animationDelay: '0.6s' }}>🌍</div>
        <div className="absolute bottom-1/5 left-2/3 text-5xl md:text-6xl opacity-20 animate-bounce" style={{ animationDuration: '4.7s', animationDelay: '1.4s' }}>🌎</div>
      </div>
      {/* Countdown Timer - Top Left */}
      {isCountdownActive && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-3 border border-gray-200"
        >
          <div className="text-xs text-gray-700 mb-1 font-semibold">Launch Countdown</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-blue-400">{timeRemaining.days}d</span>
            <span className="text-gray-400">:</span>
            <span className="font-bold text-yellow-500">{String(timeRemaining.hours).padStart(2, '0')}h</span>
            <span className="text-gray-400">:</span>
            <span className="font-bold text-blue-600">{String(timeRemaining.minutes).padStart(2, '0')}m</span>
            <span className="text-gray-400">:</span>
            <span className="font-bold text-green-600">{String(timeRemaining.seconds).padStart(2, '0')}s</span>
          </div>
        </motion.div>
      )}

      {/* User Info / Sign Up Button - Top Right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 right-4 flex items-center gap-3"
      >
        {user ? (
          <>
            <div className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg px-4 py-2 border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Welcome, {user.fullName}</span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              Logout
            </motion.button>
          </>
        ) : (
          <>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-2 border-blue-600 text-blue-600 text-sm font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-shadow mr-2"
              >
                Log In
              </motion.button>
            </Link>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                Sign Up ✨
              </motion.button>
            </Link>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        {/* Logos - Stacked vertically */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center gap-3 mb-6 w-full"
        >
          <img
            src="/Ureka Logo.png.png"
            alt="Ureka Logo"
            className="h-12 md:h-14 lg:h-16 object-contain max-w-[180px] md:max-w-[200px]"
            style={{ display: 'block', margin: '0 auto' }}
            onError={(e) => {
              console.error('Ureka Logo not found')
              e.target.style.display = 'none'
            }}
          />
          <img
            src="/Unitar Logo.png.png"
            alt="Unitar Logo"
            className="h-12 md:h-14 lg:h-16 object-contain max-w-[180px] md:max-w-[200px]"
            style={{ display: 'block', margin: '0 auto' }}
            onError={(e) => {
              console.error('Unitar Logo not found')
              e.target.style.display = 'none'
            }}
          />
        </motion.div>

        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl md:text-6xl font-bold mb-4 relative inline-block overflow-hidden"
        >
          <span className="relative inline-block text-yellow-600">
            <span className="relative z-10">AI For Social Impact : AI Youth Directors</span>
            <motion.span
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                width: '50%',
                height: '100%',
                transform: 'skewX(-20deg)',
              }}
              animate={{
                x: ['-100%', '300%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'easeInOut',
              }}
            />
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-600 mb-2"
        >
          Animated movies are created through AI
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-700 mb-12"
        >
          Create animated movies about Sustainable Development Goals
        </motion.p>


        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/studio">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              Start a Movie 🎬
            </motion.button>
          </Link>
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotes(true)}
              className="bg-white border-2 border-blue-800 text-blue-800 text-xl font-bold py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              Notes before starting 📝
            </motion.button>
            <Link href="/sdgs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-2 border-blue-400 text-blue-500 text-xl font-bold py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                Learn About SDGs 🌍
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Action Buttons - Right Side */}
      <RightCenterFloatingActions />

      {/* Notes Modal */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNotes(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">📝 Notes Before Starting</h2>
                  <button
                    onClick={() => setShowNotes(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4 text-gray-700">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-purple-800">Story Requirements:</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Write a complete story (at least 2 characters)</li>
                      <li>Include characters with names</li>
                      <li>Describe the setting (where your story happens)</li>
                      <li>Show the problem that needs solving</li>
                      <li>Present a solution or positive message</li>
                      <li>Connect to Sustainable Development Goals (SDGs)</li>
                    </ul>
                    <Link href="/sdgs" onClick={() => setShowNotes(false)}>
                      <p className="mt-3 text-purple-700 hover:text-purple-900 underline text-sm font-semibold">
                        Learn more about SDGs →
                      </p>
                    </Link>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-blue-800">Tips for Great Stories:</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Start with "Once upon a time..." or "In a world where..."</li>
                      <li>Be creative and specific</li>
                      <li>Add emotions and feelings</li>
                      <li>End with hope and positive change</li>
                      <li>Make it inspiring for other students</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-green-800">What Happens Next:</h3>
                    <p>Your story will be turned into an AI-generated animation video using Luma Dream Machine. The AI will create a visual representation of your story!</p>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Link href="/studio" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowNotes(false)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
                      >
                        Start Creating! 🎬
                      </motion.button>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowNotes(false)}
                      className="bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-full hover:bg-gray-300"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

