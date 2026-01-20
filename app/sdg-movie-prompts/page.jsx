'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent">
            SDG Movie Prompts (9s)
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Professional prompt pack. Each prompt is optimized for a 9-second continuous shot with minimal glitches.
          </p>

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
    </div>
  )
}

