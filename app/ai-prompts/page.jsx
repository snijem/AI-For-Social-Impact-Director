'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'

export default function AIPromptsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [ageGroup, setAgeGroup] = useState(null)

  useEffect(() => {
    if (user?.age) {
      const ageNum = parseInt(user.age)
      if (!isNaN(ageNum)) {
        if (ageNum >= 10 && ageNum <= 14) {
          setAgeGroup('10-14')
        } else if (ageNum >= 15 && ageNum <= 17) {
          setAgeGroup('15-17')
        } else {
          setAgeGroup('other')
        }
      }
    }
  }, [user])

  const handleCopyPrompt = (prompt, index) => {
    navigator.clipboard.writeText(prompt)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Animation Makers prompts (Ages 10-14) - Optimized for Luma Dream Machine
  const animationPrompts = [
    {
      title: "Friendly Character Action",
      description: "Create a cheerful animated character doing something positive",
      prompt: "A 2D animated character with bright, vibrant colors, simple geometric shapes, friendly smiling expression, doing a positive action like planting a tree or helping a friend. Clean, smooth animation style with soft edges. Educational and inspiring. Bright primary colors, cheerful atmosphere.",
      example: "A 2D animated character with bright red shirt and blue pants, simple round head with big friendly eyes, planting a small green tree in a sunny garden. Clean, smooth animation style with soft edges. Educational and inspiring. Bright primary colors, cheerful atmosphere."
    },
    {
      title: "Nature Adventure Scene",
      description: "Animate a colorful nature scene with animals",
      prompt: "A 2D animated nature scene with tall green trees, colorful flowers, happy animals like birds and rabbits, bright blue sky with fluffy white clouds. Bright, cheerful colors throughout. Simple, clean animation style. Educational about nature and protecting the environment. Warm, sunny lighting.",
      example: "A 2D animated forest scene with tall green trees swaying gently, colorful red and yellow flowers, a happy brown rabbit hopping, blue birds flying, bright blue sky with fluffy white clouds. Bright, cheerful colors throughout. Simple, clean animation style. Educational about nature and protecting the environment. Warm, sunny lighting."
    },
    {
      title: "Teamwork Animation",
      description: "Show people working together happily",
      prompt: "A 2D animated scene showing diverse children and adults working together in a community, like cleaning a park or building something. Bright, vibrant colors, simple character designs with friendly expressions, positive and cheerful atmosphere. Educational about teamwork and helping others. Smooth, fluid animation.",
      example: "A 2D animated scene showing diverse children and adults cleaning a park together, picking up trash, planting flowers, smiling and laughing. Bright, vibrant colors, simple character designs with friendly expressions, positive and cheerful atmosphere. Educational about teamwork and helping others. Smooth, fluid animation."
    },
    {
      title: "Clean Energy Future",
      description: "Animate renewable energy in a fun way",
      prompt: "A 2D animated scene showing solar panels on colorful rooftops and wind turbines in a sunny field. Bright, sunny colors with blue sky and green grass. Simple, clean animation style with smooth movement. Educational about clean energy and protecting the planet. Cheerful, optimistic mood.",
      example: "A 2D animated scene showing blue solar panels on red and yellow rooftops, white wind turbines spinning slowly in a green field, bright blue sky with a yellow sun. Bright, sunny colors throughout. Simple, clean animation style with smooth movement. Educational about clean energy and protecting the planet. Cheerful, optimistic mood."
    },
    {
      title: "Ocean Protection",
      description: "Show marine life and ocean conservation",
      prompt: "A 2D animated underwater scene with colorful fish, coral reefs, and sea turtles swimming peacefully. Bright blues, greens, and yellows. Simple, friendly character designs. Educational about protecting oceans and marine life. Smooth, flowing animation like water movement.",
      example: "A 2D animated underwater scene with colorful orange and blue fish swimming, pink and purple coral reefs, a friendly green sea turtle gliding through clear blue water. Bright blues, greens, and yellows. Simple, friendly character designs. Educational about protecting oceans and marine life. Smooth, flowing animation like water movement."
    },
    {
      title: "School Garden Project",
      description: "Animate students growing vegetables together",
      prompt: "A 2D animated scene showing children in a school garden, planting seeds, watering plants, and harvesting colorful vegetables. Bright greens, reds, and yellows. Simple, cheerful character designs. Educational about growing food and healthy eating. Warm, friendly atmosphere.",
      example: "A 2D animated scene showing children in a school garden wearing colorful clothes, planting seeds in brown soil, watering green plants with a watering can, and picking red tomatoes and yellow corn. Bright greens, reds, and yellows. Simple, cheerful character designs. Educational about growing food and healthy eating. Warm, friendly atmosphere."
    }
  ]

  // Cinematic Movie Makers prompts (Ages 15-17) - Optimized for Luma Dream Machine
  const cinematicPrompts = [
    {
      title: "Dramatic Environmental Moment",
      description: "Create a powerful scene about protecting nature",
      prompt: "A cinematic 2D animation scene at golden hour sunset, showing a person planting trees on a hillside overlooking a valley. Dramatic lighting with warm orange and purple sky, rich color palette, detailed landscape with depth. Cinematic wide shot composition, emotional atmosphere. Professional animation style. Educational and inspiring about sustainability and environmental protection.",
      example: "A cinematic 2D animation scene at golden hour sunset, showing a young person in silhouette planting a sapling on a hillside overlooking a green valley. Dramatic lighting with warm orange and purple sky, rich color palette, detailed landscape with rolling hills and trees in background. Cinematic wide shot composition, emotional atmosphere. Professional animation style. Educational and inspiring about sustainability and environmental protection."
    },
    {
      title: "Urban Social Change",
      description: "Show a powerful moment of community action",
      prompt: "A cinematic 2D animation scene showing diverse people coming together in an urban setting, working on a community project. Dynamic composition with people in foreground and cityscape in background. Rich color palette with warm and cool tones. Professional animation style with smooth camera movement. Educational about making a difference and social impact.",
      example: "A cinematic 2D animation scene showing diverse people of different ages coming together in a city park, building a community garden. Dynamic composition with people in foreground and urban buildings in background. Rich color palette with warm oranges and cool blues. Professional animation style with smooth camera movement. Educational about making a difference and social impact."
    },
    {
      title: "Futuristic Sustainable City",
      description: "Visualize an advanced sustainable future",
      prompt: "A cinematic 2D animation scene showing a futuristic sustainable city at twilight. Green buildings with vertical gardens, solar panels, wind turbines, and people using clean transportation. Futuristic elements with sleek design, hopeful atmosphere, sophisticated color grading with blues, greens, and warm accent lights. Professional animation quality with depth and detail. Inspiring and educational about sustainable technology.",
      example: "A cinematic 2D animation scene showing a futuristic sustainable city at twilight with glowing lights. Green buildings with vertical gardens, blue solar panels on rooftops, white wind turbines, and people riding electric bikes on clean streets. Futuristic elements with sleek design, hopeful atmosphere, sophisticated color grading with deep blues, vibrant greens, and warm orange accent lights. Professional animation quality with depth and detail. Inspiring and educational about sustainable technology."
    },
    {
      title: "Emotional Decision Moment",
      description: "Capture a character's pivotal choice",
      prompt: "A cinematic 2D animation scene showing a young person at a pivotal moment, making an important decision. Strong emotional storytelling with close-up on character's determined expression, cinematic framing with shallow depth of field, rich visual details in background. Dramatic lighting with contrast between light and shadow. Professional animation style with smooth character movement. Educational and inspiring about personal growth and making choices.",
      example: "A cinematic 2D animation scene showing a young person standing at a crossroads, looking determined with a close-up on their face showing resolve. Cinematic framing with shallow depth of field, rich visual details of a community in background. Dramatic lighting with warm light on face and cool shadows behind. Professional animation style with smooth character movement. Educational and inspiring about personal growth and making choices."
    },
    {
      title: "Nighttime Urban Exploration",
      description: "Create a moody city scene with atmosphere",
      prompt: "A cinematic 2D animation scene at night in an urban setting, showing a character exploring city streets. Neon lights reflecting on wet pavement, dramatic shadows, rich color palette with deep blues and vibrant neon accents. Cinematic composition with interesting angles. Professional animation style with atmospheric mood. Educational about urban life and discovery.",
      example: "A cinematic 2D animation scene at night in an urban setting, showing a young person walking through city streets with neon signs. Blue and pink neon lights reflecting on wet dark pavement, dramatic shadows, rich color palette with deep blues and vibrant neon accents. Cinematic composition with interesting angles and depth. Professional animation style with atmospheric mood. Educational about urban life and discovery."
    },
    {
      title: "Nature Reclamation",
      description: "Show nature taking back urban spaces",
      prompt: "A cinematic 2D animation scene showing nature reclaiming an abandoned urban area. Vines growing on buildings, trees breaking through concrete, wildlife returning. Rich green colors contrasting with gray urban elements. Cinematic time-lapse feel, hopeful atmosphere. Professional animation with detailed textures. Educational about nature's resilience and environmental restoration.",
      example: "A cinematic 2D animation scene showing nature reclaiming an abandoned urban area over time. Green vines growing on gray buildings, trees breaking through cracked concrete, colorful birds and butterflies returning. Rich green colors contrasting with gray urban elements. Cinematic time-lapse feel, hopeful atmosphere. Professional animation with detailed textures and smooth transitions. Educational about nature's resilience and environmental restoration."
    },
    {
      title: "Community Celebration",
      description: "Capture a joyful moment of unity",
      prompt: "A cinematic 2D animation scene showing a diverse community celebrating together in a public space. Warm, vibrant colors, dynamic composition with multiple characters, festive atmosphere. Professional animation with smooth character interactions. Educational about community, diversity, and coming together. Cinematic framing with depth and movement.",
      example: "A cinematic 2D animation scene showing a diverse community celebrating together in a public square with colorful decorations. Warm, vibrant colors of reds, yellows, and blues, dynamic composition with multiple characters dancing and laughing, festive atmosphere. Professional animation with smooth character interactions. Educational about community, diversity, and coming together. Cinematic framing with depth and movement."
    },
    {
      title: "Mountain Vista Journey",
      description: "Create an epic landscape scene",
      prompt: "A cinematic 2D animation scene showing a character on a mountain peak at sunrise, overlooking a vast landscape. Epic wide shot composition, dramatic lighting with warm golden hour colors, rich color palette with blues, purples, and oranges. Professional animation with atmospheric effects. Inspiring and educational about nature, adventure, and perspective.",
      example: "A cinematic 2D animation scene showing a character in silhouette on a mountain peak at sunrise, overlooking a vast green valley with rivers and forests. Epic wide shot composition, dramatic lighting with warm golden hour colors, rich color palette with deep blues, purple mountains, and orange sky. Professional animation with atmospheric effects like mist and light rays. Inspiring and educational about nature, adventure, and perspective."
    }
  ]

  // Important tips for all users - Based on Luma Labs best practices
  const importantTips = [
    "Be specific about visual details: colors, lighting, composition, and camera angles",
    "Always mention '2D animation' to get the animated style you want",
    "Include mood and atmosphere: 'cheerful', 'dramatic', 'hopeful', 'cinematic'",
    "For 9-second videos, focus on ONE main action or scene - don't try to tell a whole story",
    "Describe the setting clearly: location, time of day, weather, environment",
    "Use descriptive color palettes: 'bright primary colors', 'warm golden tones', 'cool blues and greens'",
    "Mention animation style: 'smooth', 'fluid', 'clean', 'professional' for best results",
    "Keep prompts between 50-150 words for optimal results with Luma Dream Machine",
    "Test and refine: try variations of your prompt to see what works best",
    "Use positive, educational language that aligns with your story's message"
  ]

  // Show loading state
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full bg-white rounded-xl shadow-2xl p-8 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
            className="text-8xl mb-6"
          >
            🔒
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Sign Up or Log In
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Please sign up or log in to see AI prompts tailored to your age group
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Sign Up
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Log In
              </motion.button>
            </Link>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-300 text-gray-700 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Back to Home
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Determine which prompts to show based on age
  const isAnimationMaker = ageGroup === '10-14'
  const isCinematicMaker = ageGroup === '15-17'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Prompts for Movie Makers
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Learn how to write great prompts for creating 9-second videos with Luma Dream Machine
          </p>
          {user?.age && (
            <div className="inline-block bg-white px-4 py-2 rounded-full shadow-md">
              <span className="text-sm text-gray-600">Age: </span>
              <span className="text-sm font-semibold text-purple-600">{user.age}</span>
            </div>
          )}
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">How AI Prompts Work</h2>
          <p className="text-gray-700 mb-4">
            AI prompts are instructions you write to tell the AI what kind of video you want to create. 
            The better your prompt, the better your video will be!
          </p>
          <p className="text-gray-700">
            Below are prompt templates designed for your age group. Click the copy button to use them, 
            then customize them with your own ideas and details.
          </p>
        </motion.div>

        {/* Age-based Content */}
        {isAnimationMaker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>🎨</span>
              <span>Animation Makers (Ages 10-14)</span>
            </h2>
            <p className="text-gray-700 mb-6">
              These prompts are designed for creating fun, colorful animated videos perfect for your age group.
            </p>

            <div className="space-y-6">
              {animationPrompts.map((promptObj, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white rounded-lg p-5 border-2 border-blue-200 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{promptObj.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{promptObj.description}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopyPrompt(promptObj.prompt, index)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors whitespace-nowrap"
                    >
                      {copiedIndex === index ? '✓ Copied!' : '📋 Copy Prompt'}
                    </motion.button>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">PROMPT TEMPLATE:</p>
                    <code className="text-sm text-gray-800 font-mono break-words">
                      {promptObj.prompt}
                    </code>
                  </div>

                  <details className="mt-3">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 font-semibold">
                      📝 See Example
                    </summary>
                    <div className="mt-2 bg-blue-50 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">EXAMPLE:</p>
                      <code className="text-sm text-gray-800 font-mono break-words">
                        {promptObj.example}
                      </code>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {isCinematicMaker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>🎬</span>
              <span>Cinematic Movie Makers (Ages 15-17)</span>
            </h2>
            <p className="text-gray-700 mb-6">
              These prompts are designed for creating more sophisticated, cinematic videos with dramatic storytelling.
            </p>

            <div className="space-y-6">
              {cinematicPrompts.map((promptObj, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white rounded-lg p-5 border-2 border-indigo-200 hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{promptObj.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{promptObj.description}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopyPrompt(promptObj.prompt, index + 100)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors whitespace-nowrap"
                    >
                      {copiedIndex === index + 100 ? '✓ Copied!' : '📋 Copy Prompt'}
                    </motion.button>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">PROMPT TEMPLATE:</p>
                    <code className="text-sm text-gray-800 font-mono break-words">
                      {promptObj.prompt}
                    </code>
                  </div>

                  <details className="mt-3">
                    <summary className="text-sm text-indigo-600 cursor-pointer hover:text-indigo-800 font-semibold">
                      📝 See Example
                    </summary>
                    <div className="mt-2 bg-indigo-50 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">EXAMPLE:</p>
                      <code className="text-sm text-gray-800 font-mono break-words">
                        {promptObj.example}
                      </code>
                    </div>
                  </details>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Show message if age doesn't match expected groups */}
        {!isAnimationMaker && !isCinematicMaker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8"
          >
            <p className="text-gray-700">
              <strong>Note:</strong> Your age ({user?.age || 'unknown'}) doesn't match the expected age groups (10-14 or 15-17). 
              Please contact support if you believe this is an error.
            </p>
          </motion.div>
        )}

        {/* Important Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>Important Tips for All Movie Makers</span>
          </h2>
          <ul className="space-y-3">
            {importantTips.map((tip, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-3 text-gray-700"
              >
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span>{tip}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <Link href="/studio">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
            >
              Go to Studio 🎬
            </motion.button>
          </Link>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
            >
              Back to Home 🏠
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

