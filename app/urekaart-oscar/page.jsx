'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function UrekaOscarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-6 text-gray-600 hover:text-gray-800 font-semibold flex items-center gap-2"
            >
              ← Back to Home
            </motion.button>
          </Link>

          {/* Logos */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <img
              src="/Ureka Logo.png.png"
              alt="Ureka Logo"
              className="h-16 md:h-20 lg:h-24 object-contain"
              onError={(e) => {
                console.error('Ureka Logo not found')
                e.target.style.display = 'none'
              }}
            />
          </motion.div>
          
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent flex items-center justify-center gap-3"
          >
            <span>🏆</span>
            <span>How to Win the Ureka Oscar</span>
            <span>🏆</span>
          </motion.h1>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">What is the Ureka Oscar?</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            The <strong>Ureka Oscar</strong> is a special recognition award for the most creative, impactful, and inspiring animated movies created on this platform. It celebrates students who use AI storytelling to make a positive difference in the world.
          </p>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 mb-6 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <span className="text-4xl">🌟</span>
              <div>
                <h3 className="text-2xl font-bold mb-2">Win Recognition on Ureka Social Platforms!</h3>
                <p className="text-lg leading-relaxed">
                  The <strong>best 9-second video</strong> that uses AI prompts correctly and produces the idea perfectly gets featured and recognized on <strong>Ureka's official social media platforms</strong>! 🎉
                </p>
                <p className="text-lg mt-3 font-semibold">
                  Show the world your creativity and get the recognition you deserve!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border-l-4 border-yellow-500">
            <p className="text-gray-800 font-semibold text-lg">
              🎯 Your goal: Create a perfect 9-second animated video that uses AI prompts correctly and brings your idea to life!
            </p>
          </div>
        </motion.div>

        {/* How to Win Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">How to Win</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Create Your Story</h3>
                <p className="text-gray-700 leading-relaxed">
                  Write a compelling story that connects to one or more Sustainable Development Goals (SDGs). Make it original, creative, and meaningful.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Focus on Impact</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your story should address a real-world problem and show how positive change can happen. Think about how your story can inspire others to take action.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Be Creative</h3>
                <p className="text-gray-700 leading-relaxed">
                  Use your imagination! Create interesting characters, vivid settings, and a story that captures attention. Originality and creativity are highly valued.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Generate Your 9-Second Movie</h3>
                <p className="text-gray-700 leading-relaxed">
                  Use the AI tools to transform your story into a <strong>9-second animated video</strong>. Master the AI prompts - write clear, detailed descriptions that help the AI produce your idea perfectly. The better your prompts, the better your video!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Submit & Get Featured!</h3>
                <p className="text-gray-700 leading-relaxed">
                  Once your 9-second movie is complete, submit it for consideration. The winning video that best uses AI prompts and produces the idea perfectly will be <strong>featured on Ureka's social media platforms</strong> - Instagram, Facebook, and more! 🚀
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Judging Criteria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Judging Criteria</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-5 shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🤖</span>
                <span>AI Prompt Mastery</span>
              </h3>
              <p className="text-gray-700">
                How well do you use AI prompts? Does your video perfectly match your original idea? This is key to winning!
              </p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Creativity & Originality</span>
              </h3>
              <p className="text-gray-700">
                How unique and imaginative is your story? Does it present ideas in a fresh, engaging way?
              </p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🌍</span>
                <span>SDG Connection</span>
              </h3>
              <p className="text-gray-700">
                How well does your story connect to and address Sustainable Development Goals?
              </p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>💪</span>
                <span>Impact & Message</span>
              </h3>
              <p className="text-gray-700">
                Does your story inspire action? Does it clearly communicate a positive message for change?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Pro Tips to Win & Get Featured</h2>
          <ul className="space-y-3 text-gray-700 text-lg">
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">🎯</span>
              <span><strong>Master AI Prompts:</strong> Write detailed, specific descriptions. The AI needs clear instructions to produce your idea perfectly in 10 seconds!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">⏱️</span>
              <span><strong>Optimize for 9 Seconds:</strong> Keep your story concise and impactful. Every second counts in a 9-second video!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">🌍</span>
              <span>Start with a clear problem that relates to an SDG (like climate change, poverty, or education)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">👥</span>
              <span>Create memorable characters that people can relate to</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">✨</span>
              <span>Show both the problem and a hopeful solution</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">📝</span>
              <span>Use vivid, descriptive language to help the AI create better visuals - be specific about colors, actions, and emotions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold text-xl">💬</span>
              <span>End with a powerful message that inspires others to take action</span>
            </li>
          </ul>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Create Your Winning 9-Second Video?</h2>
          <p className="text-white text-lg mb-2 opacity-90">
            Master AI prompts, create the perfect 9-second video, and get featured on Ureka's social platforms! 🚀
          </p>
          <p className="text-white text-xl mb-6 font-bold">
            Your creativity could be seen by thousands! 🌟
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sdgs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-yellow-600 text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
              >
                Learn About SDGs 🌍
              </motion.button>
            </Link>
            <Link href="/studio">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-yellow-600 text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
              >
                Start Creating 🎬
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

