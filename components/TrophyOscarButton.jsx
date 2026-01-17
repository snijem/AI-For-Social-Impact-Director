'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TrophyOscarButton() {
  const router = useRouter()
  const [rippleKey, setRippleKey] = useState(0)

  const handleClick = (e) => {
    // Trigger ripple effect
    setRippleKey(prev => prev + 1)
    
    // Navigate after a brief delay for visual feedback
    setTimeout(() => {
      router.push('/urekaart-oscar')
    }, 200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 8px 24px rgba(184, 134, 11, 0.3)'
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="AI Youth Director Award - How to win"
      className="cursor-pointer focus:outline-none focus:ring-4 focus:ring-yellow-200 focus:ring-offset-2 touch-manipulation relative"
      style={{
        width: '180px',
        height: '180px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Clean Modern Star Trophy SVG */}
      <svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        <defs>
          {/* Gold gradient for star */}
          <linearGradient id="starGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffed4e" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffb347" stopOpacity="1" />
          </linearGradient>
          
          {/* Star highlight - top left */}
          <linearGradient id="starHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff9c4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffed4e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          
          {/* Star shadow - bottom right */}
          <linearGradient id="starShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="50%" stopColor="#d4a017" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#b8860b" stopOpacity="0.6" />
          </linearGradient>
          
          {/* Base gradient */}
          <linearGradient id="starBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2c3e50" stopOpacity="1" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Base - Rounded rectangular base (wider and taller) */}
        <rect
          x="20"
          y="150"
          width="140"
          height="28"
          rx="6"
          fill="url(#starBase)"
        />
        
        {/* Base top highlight */}
        <rect
          x="22"
          y="150"
          width="136"
          height="3"
          rx="3"
          fill="rgba(255,255,255,0.15)"
        />
        
        {/* Stem - Slim vertical stem (adjusted position) */}
        <rect
          x="84"
          y="125"
          width="12"
          height="25"
          rx="3"
          fill="url(#starGold)"
        />
        
        {/* Stem highlight */}
        <rect
          x="85.5"
          y="125"
          width="4.5"
          height="25"
          rx="1.5"
          fill="url(#starHighlight)"
        />
        
        {/* Five-point star - Perfectly symmetrical (scaled up) */}
        {/* Star outer points (5 points) */}
        <path
          d="M90 22.5
             L102 57
             L138 57
             L109.5 78
             L120 112.5
             L90 90
             L60 112.5
             L70.5 78
             L42 57
             L78 57
             Z"
          fill="url(#starGold)"
        />
        
        {/* Star highlight overlay - top left area */}
        <path
          d="M90 22.5
             L102 57
             L90 57
             L90 45
             Z"
          fill="url(#starHighlight)"
          opacity="0.7"
        />
        
        {/* Star shadow overlay - bottom right area */}
        <path
          d="M90 90
             L120 112.5
             L109.5 112.5
             L90 97.5
             Z"
          fill="url(#starShadow)"
          opacity="0.5"
        />
        
        {/* Inner star highlight - center glow */}
        <circle
          cx="90"
          cy="67.5"
          r="12"
          fill="url(#starHighlight)"
          opacity="0.4"
        />
        
        {/* Award text on base (positioned within base) */}
        <text
          x="90"
          y="165"
          fontSize="12"
          fontWeight="600"
          fill="#ffffff"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity="0.9"
        >
          9s Movie Director
        </text>
        <text
          x="90"
          y="177"
          fontSize="10.5"
          fontWeight="500"
          fill="#e0e0e0"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity="0.8"
        >
          Winner Award
        </text>
      </svg>


      {/* Star hover glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{
          filter: 'blur(8px)',
        }}
        whileHover={{ opacity: 0.4 }}
        transition={{ duration: 0.3 }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="30%">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M90 22.5 L102 57 L138 57 L109.5 78 L120 112.5 L90 90 L60 112.5 L70.5 78 L42 57 L78 57 Z"
            fill="url(#starGlow)"
          />
        </svg>
      </motion.div>

      {/* Subtle ripple effect on click */}
      <motion.div
        key={rippleKey}
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(244, 208, 63, 0.4) 0%, transparent 70%)',
        }}
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.button>
  )
}

