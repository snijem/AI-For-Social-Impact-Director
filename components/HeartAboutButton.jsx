'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HeartAboutButton() {
  const router = useRouter()
  const [rippleKey, setRippleKey] = useState(0)

  const handleClick = (e) => {
    // Trigger ripple effect
    setRippleKey(prev => prev + 1)
    
    // Navigate after a brief delay for visual feedback
    setTimeout(() => {
      router.push('/about')
    }, 200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  // Heart shape clip-path (smooth heart shape)
  const heartClipPath = 'polygon(50% 92%, 38% 84%, 28% 74%, 20% 64%, 14% 54%, 11% 44%, 12% 34%, 18% 26%, 26% 20%, 36% 18%, 46% 20%, 50% 26%, 54% 20%, 64% 18%, 74% 20%, 82% 26%, 88% 34%, 89% 44%, 86% 54%, 80% 64%, 72% 74%, 62% 84%)'

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
      }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="About Us"
      className="cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-300 focus:ring-offset-2 touch-manipulation"
      style={{
        width: '120px',
        height: '120px',
        background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
        clipPath: heartClipPath,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Text inside heart */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        style={{
          clipPath: heartClipPath,
        }}
      >
        <span
          className="text-white font-semibold text-lg select-none"
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontWeight: 600,
          }}
        >
          Tap
        </span>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #f87171 0%, #f472b6 100%)',
          clipPath: heartClipPath,
          filter: 'blur(12px)',
        }}
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.2 }}
      />

      {/* Ripple effect on click */}
      <motion.div
        key={rippleKey}
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: heartClipPath,
        }}
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div
          className="w-full h-full bg-white rounded-full"
          style={{
            clipPath: heartClipPath,
          }}
        />
      </motion.div>
    </motion.button>
  )
}

