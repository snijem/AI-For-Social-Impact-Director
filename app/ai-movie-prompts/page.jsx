'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

// Animation prompts for ages 10-14
const animationPrompts = [
  {
    title: 'PROMPT 1 — "THE GROWING SEED"',
    theme: 'Growth / Nature',
    prompt: `An animated single-shot scene of a small seed on dry cracked ground, bright colorful lighting.
As the camera slowly zooms in, the seed sprouts into a vibrant green plant with leaves.
Smooth animated motion, playful colors, cheerful atmosphere, simple but clear story.
Stable composition, single scene, no flickering, animated style. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Seed → Growth → Life'
  },
  {
    title: 'PROMPT 2 — "THE MAGICAL LIGHT"',
    theme: 'Hope / Discovery',
    prompt: `An animated scene of a dark room with a single glowing lightbulb, warm yellow lighting.
As the camera slowly pushes forward, the lightbulb brightens and spreads colorful light across the room.
Smooth animated motion, vibrant colors, magical atmosphere, simple transformation.
Stable composition, single scene, no distortion, animated style. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Dark → Light → Joy'
  },
  {
    title: 'PROMPT 3 — "THE FLYING MESSAGE"',
    theme: 'Communication / Friendship',
    prompt: `An animated scene of a person drawing a message on paper at a desk, bright cheerful lighting.
The camera slowly pans as the paper folds into a paper airplane and flies away.
Smooth animated motion, colorful style, friendly atmosphere, simple but meaningful.
Stable composition, no glitches, animated style. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Message → Action → Freedom'
  },
  {
    title: 'PROMPT 4 — "THE CLOCK TICK"',
    theme: 'Time / Patience',
    prompt: `An animated shot of a colorful clock on a wall, warm afternoon lighting.
As the camera slowly pushes in, the clock hands move forward and colorful sparkles appear.
Smooth animated motion, bright colors, playful atmosphere, simple time passage.
Single scene, stable visuals, animated style. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Time → Patience → Progress'
  },
  {
    title: 'PROMPT 5 — "THE BUTTERFLY"',
    theme: 'Transformation / Change',
    prompt: `An animated scene of a small caterpillar on a leaf, sunny natural lighting.
As the camera slowly zooms in, the caterpillar transforms into a beautiful colorful butterfly.
Smooth animated transformation, vibrant colors, magical atmosphere, simple but powerful.
Stable composition, single scene, animated style. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Small → Change → Beautiful'
  },
  {
    title: 'PROMPT 6 — "THE STAR"',
    theme: 'Dreams / Aspiration',
    prompt: `An animated scene of a dark sky with one small star, soft starlight.
As the camera slowly pulls back, the star grows brighter and more stars appear around it.
Smooth animated motion, glowing colors, dreamy atmosphere, simple but inspiring.
Single continuous shot, stable framing, animated style. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'One → Many → Dreams'
  }
]

// Cinematic prompts for ages 15-17
const cinematicPrompts = [
  {
    title: 'PROMPT 1 — "THE REALIZATION"',
    theme: 'Awareness / Self-discovery',
    prompt: `A cinematic single-shot scene of a young person staring into a mirror in a dark room, soft dramatic lighting.
As the camera slowly pushes forward, the reflection changes to show a confident future version of them.
Realistic human motion, subtle facial expression shift, cinematic lighting, smooth camera movement, emotional but minimal.
Stable composition, single scene, no distortion, no extra limbs. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Doubt → Vision → Hope'
  },
  {
    title: 'PROMPT 2 — "ONE SMALL ACT"',
    theme: 'Change starts small',
    prompt: `A cinematic scene of a single seed falling into dry cracked soil, warm natural lighting.
The camera slowly zooms in as a small green sprout pushes through the ground.
Realistic plant motion, soft depth of field, cinematic color grading, hopeful atmosphere.
Stable composition, single scene, no flickering. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Problem → Action → Impact'
  },
  {
    title: 'PROMPT 3 — "CHOICE"',
    theme: 'Decision moment',
    prompt: `A cinematic scene of a person standing between two glowing doors in a dark futuristic hallway, blue and red lighting.
The camera slowly circles as the person hesitates, then reaches toward the softer light.
Realistic body motion, cinematic lighting, dramatic but calm mood.
Stable composition, no sudden transitions. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Conflict → Decision → Meaning'
  },
  {
    title: 'PROMPT 4 — "TIME"',
    theme: 'Time passing',
    prompt: `A cinematic shot of an old clock on a wall in a quiet room, warm sunset lighting.
As the camera slowly pushes in, the clock hands dissolve into light particles.
Realistic motion, smooth transition, cinematic atmosphere, poetic tone.
Single scene, stable visuals, no distortion. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Time → Change → Letting go'
  },
  {
    title: 'PROMPT 5 — "THE MESSAGE"',
    theme: 'Communication',
    prompt: `A cinematic scene of a person writing a message on paper at a desk, soft warm lighting.
The camera slowly pans as the message is folded into a paper airplane and released.
Realistic hand movement, smooth motion, cinematic depth of field.
Stable composition, no glitches, no scene cuts. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Thought → Action → Release'
  },
  {
    title: 'PROMPT 6 — "FROM ZERO"',
    theme: 'Growth',
    prompt: `A cinematic scene of a dark empty stage under a single spotlight.
As the camera slowly pulls back, the light expands revealing an audience silhouette.
Smooth lighting change, cinematic contrast, inspirational mood.
Single continuous shot, realistic motion, stable framing. Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`,
    story: 'Nothing → Effort → Recognition'
  }
]

export default function AIMoviePromptsPage() {
  const { user, loading } = useAuth()
  const [copiedIndex, setCopiedIndex] = useState(null)

  // Determine which prompts to show based on age
  const getPrompts = () => {
    if (!user?.age) return null
    
    const age = parseInt(user.age)
    if (isNaN(age)) return null
    
    if (age >= 10 && age <= 14) {
      return { type: 'animation', prompts: animationPrompts, title: 'Animation Makers (Ages 10–14)' }
    } else if (age >= 15 && age <= 17) {
      return { type: 'cinematic', prompts: cinematicPrompts, title: 'Cinematic Movie Makers (Ages 15–17)' }
    }
    
    return null
  }

  const promptData = getPrompts()

  const handleCopyPrompt = (prompt, index) => {
    navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto px-4 py-10">
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
              Studio 🎬
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
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent">
            AI Movie Prompts (9s)
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Sign Up or Log In</h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view age-appropriate AI prompts.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
                  >
                    Sign Up
                  </motion.button>
                </Link>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white border-2 border-blue-600 text-blue-600 font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
                  >
                    Log In
                  </motion.button>
                </Link>
              </div>
            </div>
          ) : !promptData ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Age Not Supported</h2>
              <p className="text-gray-600 mb-6">
                AI prompts are currently available for ages 10-17. Please update your profile age if needed.
              </p>
              <p className="text-sm text-gray-500">
                Your current age: {user.age || 'Not set'}
              </p>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              {/* Intro Section */}
              <div className="mb-8">
                <p className="text-gray-700 mb-4">
                  These prompts are designed so:
                </p>
                <ul className="list-disc list-inside mb-8 space-y-2 text-gray-700">
                  <li>the <strong>story idea is clear within 9 seconds</strong></li>
                  <li><strong>concept &gt; visuals</strong>, so judges can score fairly</li>
                  <li>minimal glitches, stable motion</li>
                  <li>easy to rank creativity, emotion, and storytelling</li>
                </ul>
              </div>

              <hr className="my-8 border-gray-300" />

              {/* Challenge Rules */}
              <h2 className="text-3xl font-bold mt-10 mb-6 text-gray-800">
                🎥 AI MOVIE CHALLENGE RULE
              </h2>

              <p className="text-gray-700 mb-4">
                <strong>Goal:</strong>
              </p>
              <p className="text-gray-700 mb-4">
                Create a <strong>complete story in ≤9 seconds</strong> with:
              </p>
              <ol className="list-decimal list-inside mb-6 space-y-2 text-gray-700">
                <li><strong>Beginning (0–3s)</strong> – Setup</li>
                <li><strong>Middle (3–6s)</strong> – Change / Conflict</li>
                <li><strong>End (6–9s)</strong> – Twist / Message</li>
              </ol>

              <p className="text-gray-700 mb-2">
                <strong>Allowed:</strong> 1 scene, 1 camera move, 1 main subject
              </p>
              <p className="text-gray-700 mb-8">
                <strong>Not allowed:</strong> scene cuts, explosions, fast motion
              </p>

              <hr className="my-8 border-gray-300" />

              {/* Age-Based Prompts Section */}
              <h2 className="text-3xl font-bold mt-10 mb-6 text-gray-800">
                🏆 CONTEST PROMPT TEMPLATES — {promptData.title}
              </h2>

              <p className="text-gray-600 mb-8 italic">
                {promptData.type === 'animation' 
                  ? '[Image inspiration queries: animated storytelling single shot; colorful animated scene; playful animated visual; simple animated story]'
                  : '[Image inspiration queries: cinematic storytelling single shot; cinematic emotional reveal; minimalist cinematic scene; symbolic cinematic visual]'}
              </p>

              {/* Prompts List */}
              {promptData.prompts.map((promptObj, index) => (
                <div key={index}>
                  <hr className="my-8 border-gray-300" />
                  
                  <h2 className="text-3xl font-bold mt-10 mb-4 text-gray-800">
                    🎬 {promptObj.title}
                  </h2>
                  <p className="text-gray-700 mb-4">
                    <strong>Theme:</strong> {promptObj.theme}
                  </p>

                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-4 text-sm md:text-base">
                      <code>{promptObj.prompt}</code>
                    </pre>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopyPrompt(promptObj.prompt, index)}
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    >
                      {copiedIndex === index ? '✓ Copied!' : '📋 Copy'}
                    </motion.button>
                  </div>

                  <p className="text-gray-700 mb-8">
                    🧠 <strong>Story told:</strong> {promptObj.story}
                  </p>
                </div>
              ))}

              <hr className="my-8 border-gray-300" />

              {/* Judging Criteria */}
              <h2 className="text-3xl font-bold mt-10 mb-6 text-gray-800">
                🏅 JUDGING CRITERIA
              </h2>

              <div className="overflow-x-auto mb-8">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Criteria</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">Idea clarity in 9s</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">30</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">Emotional impact</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">25</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">Creativity</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">20</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">Visual stability</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">15</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">Theme relevance</td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">10</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <hr className="my-8 border-gray-300" />

              {/* Anti-Cheat Line */}
              <h2 className="text-3xl font-bold mt-10 mb-4 text-gray-800">
                🧠 OPTIONAL "ANTI-CHEAT" LINE (MANDATORY)
              </h2>
              <p className="text-gray-700 mb-4">
                Require participants to append this:
              </p>

              <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto mb-8 text-sm md:text-base">
                <code>{`Single continuous shot, stable scene, realistic motion, no glitches, no fast movement, no scene cuts.`}</code>
              </pre>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
