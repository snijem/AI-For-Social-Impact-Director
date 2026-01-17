'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AboutPage() {
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
            <img
              src="/Unitar Logo.png.png"
              alt="Unitar Logo"
              className="h-16 md:h-20 lg:h-24 object-contain"
              onError={(e) => {
                console.error('Unitar Logo not found')
                e.target.style.display = 'none'
              }}
            />
          </motion.div>
          
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent"
          >
            About Us
          </motion.h1>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">About This Program</h2>
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
            <p>
              This website is a <strong>special program space by Ureka</strong>, created for young people aged <strong>10–17</strong>.
            </p>
            <p>
              Here, you can use <strong>artificial intelligence (AI)</strong> to create short animations and stories about real-world topics, like protecting the planet, helping communities, and building a better future. These ideas are inspired by the <strong>United Nations Sustainable Development Goals (SDGs)</strong>.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mt-6">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">This platform is designed to help you:</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-3 text-xl">✨</span>
                  <span>Learn through creativity, not memorization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-xl">🛡️</span>
                  <span>Use AI in a safe and responsible way</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-xl">💡</span>
                  <span>Share ideas, stories, and solutions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-xl">🚀</span>
                  <span>Build confidence in technology and storytelling</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-6">
              <p className="text-gray-800">
                <strong>Important:</strong> This is <strong>not</strong> Ureka's main website. It's a <strong>temporary IPP program platform</strong> made just for this experience.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <p>
                Whether you love art, technology, storytelling, or problem-solving, this is a space where <strong>your ideas matter</strong>.
              </p>
              <div className="flex flex-col gap-3 text-center font-semibold text-gray-800 text-xl">
                <p>Create with purpose.</p>
                <p>Learn by doing.</p>
                <p>Use AI to make a positive impact.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Get Started</h2>
          <p className="text-gray-700 text-lg mb-6">
            Ready to create your first animated movie? Start by learning about SDGs and then create your story!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/sdgs">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
              >
                Learn About SDGs 🌍
              </motion.button>
            </Link>
            <Link href="/studio">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl"
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

