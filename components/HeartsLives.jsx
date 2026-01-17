'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

/**
 * HeartsLives Component
 * Displays 3 hearts representing user's remaining lives (each life = $2 budget)
 * Each heart is filled (red) when available, or empty (gray) when used
 */
export default function HeartsLives({ refreshTrigger }) {
  const { user } = useAuth()
  const [lives, setLives] = useState(3) // Default to 3 lives
  const [loading, setLoading] = useState(true)

  // Fetch user's remaining lives from API
  const fetchLives = async () => {
    if (!user) {
      setLoading(false)
      setLives(3) // Default for non-logged-in users
      return
    }

    try {
      const response = await fetch('/api/user/lives')
      if (response.ok) {
        const data = await response.json()
        setLives(data.lives_remaining ?? 3)
      } else {
        // If API fails, default to 3 lives
        console.warn('Failed to fetch lives, using default:', response.status)
        setLives(3)
      }
    } catch (error) {
      console.error('Error fetching lives:', error)
      setLives(3) // Default to 3 on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLives()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && user) {
      fetchLives()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  // Heart SVG path (same as HeartAboutButton)
  const heartPath = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2" title={`${lives} of 3 lives remaining`}>
      {[1, 2, 3].map((heartNumber) => {
        const isFilled = heartNumber <= lives
        
        return (
          <motion.div
            key={heartNumber}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: heartNumber * 0.1, type: "spring", stiffness: 200 }}
            className="relative"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm"
            >
              {/* Heart shape */}
              <path
                d={heartPath}
                fill={isFilled ? '#ef4444' : '#e5e7eb'}
                stroke={isFilled ? '#dc2626' : '#9ca3af'}
                strokeWidth="1"
                className="transition-all duration-300"
              />
              {/* Gradient overlay for filled hearts */}
              {isFilled && (
                <defs>
                  <linearGradient id={`heartGradient-${heartNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              )}
              {isFilled && (
                <path
                  d={heartPath}
                  fill={`url(#heartGradient-${heartNumber})`}
                  opacity="0.7"
                />
              )}
            </svg>
            
            {/* Pulse animation for the last remaining heart */}
            {lives === 1 && heartNumber === 1 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                }}
              />
            )}
          </motion.div>
        )
      })}
      
      {/* Lives count text (optional, can be hidden if you want just hearts) */}
      <span className="text-xs text-gray-600 ml-1 font-medium">
        {lives}/3
      </span>
    </div>
  )
}

