'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { aiPromptsByAge, getAgeGroup, defaultPrompts } from '../data/aiPrompts'

export default function AIPromptsPanel() {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState([])
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)

  useEffect(() => {
    if (user?.age) {
      const ageGroup = getAgeGroup(user.age)
      const agePrompts = aiPromptsByAge[ageGroup] || defaultPrompts
      setPrompts(agePrompts)
    } else {
      setPrompts(defaultPrompts)
    }
  }, [user])

  const handleCopyPrompt = (prompt, index) => {
    navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSelectPrompt = (promptObj) => {
    setSelectedPrompt(promptObj)
  }

  if (prompts.length === 0) {
    return null // Don't show if no prompts available yet
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🤖</span>
          <span>AI Prompts for Your Age</span>
        </h2>
        {user?.age && (
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
            Age {user.age}
          </span>
        )}
      </div>

      <p className="text-gray-700 mb-4 text-sm">
        Use these prompts to help the AI create better videos. Click to copy or view details.
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {prompts.map((promptObj, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {promptObj.title && (
                    <h3 className="font-bold text-gray-800 mb-1">{promptObj.title}</h3>
                  )}
                  {promptObj.description && (
                    <p className="text-sm text-gray-600 mb-2">{promptObj.description}</p>
                  )}
                  <div className="bg-gray-50 rounded p-2 text-xs text-gray-700 font-mono break-words">
                    {promptObj.prompt || 'Prompt will be added here'}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopyPrompt(promptObj.prompt || '', index)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    title="Copy prompt"
                  >
                    {copiedIndex === index ? '✓ Copied!' : '📋 Copy'}
                  </motion.button>
                  {promptObj.prompt && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectPrompt(promptObj)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    >
                      View
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {prompts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>AI prompts for your age group will be available soon!</p>
        </div>
      )}

      {/* Prompt Detail Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPrompt(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedPrompt.title || 'AI Prompt'}
                  </h3>
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                {selectedPrompt.description && (
                  <p className="text-gray-700 mb-4">{selectedPrompt.description}</p>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Prompt:</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPrompt.prompt)
                        setCopiedIndex(-1)
                        setTimeout(() => setCopiedIndex(null), 2000)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded"
                    >
                      {copiedIndex === -1 ? '✓ Copied!' : '📋 Copy'}
                    </motion.button>
                  </div>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {selectedPrompt.prompt}
                  </pre>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPrompt.prompt)
                      setSelectedPrompt(null)
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    Copy & Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPrompt(null)}
                    className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

