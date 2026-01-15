'use client'

import { motion } from 'framer-motion'

export default function OriginalityMeter({ score, flags, suggestions }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-orange-500 to-red-500'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Improvement'
    return 'Needs Work'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border-2 border-purple-200 shadow-md"
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">Human Voice Score</h3>
          <span className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
            {score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getScoreColor(score)} rounded-full`}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">{getScoreLabel(score)}</p>
      </div>

      {flags.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">⚠️ Areas to improve:</h4>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {flags.map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">💡 Tips:</h4>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500 italic mt-3 pt-3 border-t border-gray-200">
        💬 This is a guide, not a judgment. Use these tips to make your story even better!
      </p>
    </motion.div>
  )
}

