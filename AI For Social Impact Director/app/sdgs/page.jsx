'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const sdgs = [
  {
    number: 1,
    title: 'No Poverty',
    color: 'from-red-500 to-red-700',
    description: 'End poverty in all its forms everywhere',
    icon: '🏠'
  },
  {
    number: 2,
    title: 'Zero Hunger',
    color: 'from-yellow-500 to-yellow-700',
    description: 'End hunger, achieve food security and improved nutrition',
    icon: '🌾'
  },
  {
    number: 3,
    title: 'Good Health and Well-being',
    color: 'from-green-500 to-green-700',
    description: 'Ensure healthy lives and promote well-being for all',
    icon: '💚'
  },
  {
    number: 4,
    title: 'Quality Education',
    color: 'from-red-500 to-red-700',
    description: 'Ensure inclusive and equitable quality education',
    icon: '📚'
  },
  {
    number: 5,
    title: 'Gender Equality',
    color: 'from-orange-500 to-orange-700',
    description: 'Achieve gender equality and empower all women and girls',
    icon: '⚖️'
  },
  {
    number: 6,
    title: 'Clean Water and Sanitation',
    color: 'from-blue-500 to-blue-700',
    description: 'Ensure availability and sustainable management of water',
    icon: '💧'
  },
  {
    number: 7,
    title: 'Affordable and Clean Energy',
    color: 'from-yellow-500 to-yellow-700',
    description: 'Ensure access to affordable, reliable, sustainable energy',
    icon: '⚡'
  },
  {
    number: 8,
    title: 'Decent Work and Economic Growth',
    color: 'from-red-500 to-red-700',
    description: 'Promote sustained, inclusive economic growth and employment',
    icon: '💼'
  },
  {
    number: 9,
    title: 'Industry, Innovation and Infrastructure',
    color: 'from-orange-500 to-orange-700',
    description: 'Build resilient infrastructure, promote innovation',
    icon: '🏭'
  },
  {
    number: 10,
    title: 'Reduced Inequalities',
    color: 'from-pink-500 to-pink-700',
    description: 'Reduce inequality within and among countries',
    icon: '🤝'
  },
  {
    number: 11,
    title: 'Sustainable Cities and Communities',
    color: 'from-yellow-500 to-yellow-700',
    description: 'Make cities and human settlements inclusive and sustainable',
    icon: '🏙️'
  },
  {
    number: 12,
    title: 'Responsible Consumption and Production',
    color: 'from-orange-500 to-orange-700',
    description: 'Ensure sustainable consumption and production patterns',
    icon: '♻️'
  },
  {
    number: 13,
    title: 'Climate Action',
    color: 'from-green-500 to-green-700',
    description: 'Take urgent action to combat climate change',
    icon: '🌍'
  },
  {
    number: 14,
    title: 'Life Below Water',
    color: 'from-blue-500 to-blue-700',
    description: 'Conserve and sustainably use oceans, seas and marine resources',
    icon: '🐠'
  },
  {
    number: 15,
    title: 'Life on Land',
    color: 'from-green-500 to-green-700',
    description: 'Protect, restore and promote sustainable use of terrestrial ecosystems',
    icon: '🌳'
  },
  {
    number: 16,
    title: 'Peace, Justice and Strong Institutions',
    color: 'from-blue-500 to-blue-700',
    description: 'Promote peaceful and inclusive societies',
    icon: '🕊️'
  },
  {
    number: 17,
    title: 'Partnerships for the Goals',
    color: 'from-blue-500 to-blue-700',
    description: 'Strengthen the means of implementation and revitalize partnerships',
    icon: '🤝'
  }
]

export default function SDGsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
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

          {/* Logos - Stacked vertically */}
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
            UN Sustainable Development Goals
          </motion.h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-6">
            The Global Goals for a Better World
          </p>
        </motion.div>

        {/* Introduction Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-800">What are the SDGs?</h2>
          <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
            <p>
              The <strong>Sustainable Development Goals (SDGs)</strong> are a collection of 17 interconnected global goals designed to be a "blueprint to achieve a better and more sustainable future for all."
            </p>
            <p>
              They were adopted by all United Nations Member States in 2015 as part of the <strong>2030 Agenda for Sustainable Development</strong>, which provides a shared blueprint for peace and prosperity for people and the planet, now and into the future.
            </p>
            <p>
              The 17 SDGs recognize that action in one area will affect outcomes in others, and that development must balance social, economic and environmental sustainability.
            </p>
          </div>
        </motion.div>

        {/* Key Facts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-800 mb-2">17</div>
            <div className="text-gray-700 font-semibold">Goals</div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-green-800 mb-2">169</div>
            <div className="text-gray-700 font-semibold">Targets</div>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-purple-800 mb-2">2030</div>
            <div className="text-gray-700 font-semibold">Target Year</div>
          </div>
        </motion.div>

        {/* The 5 Ps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-12"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">The 5 P's of Sustainable Development</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { letter: 'P', word: 'People', desc: 'End poverty and hunger', color: 'from-red-500 to-pink-500' },
              { letter: 'P', word: 'Planet', desc: 'Protect our environment', color: 'from-green-500 to-emerald-500' },
              { letter: 'P', word: 'Prosperity', desc: 'Ensure prosperous lives', color: 'from-yellow-500 to-orange-500' },
              { letter: 'P', word: 'Peace', desc: 'Foster peaceful societies', color: 'from-blue-500 to-cyan-500' },
              { letter: 'P', word: 'Partnership', desc: 'Revitalize partnerships', color: 'from-purple-500 to-indigo-500' }
            ].map((p, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`bg-gradient-to-br ${p.color} rounded-lg p-4 text-white text-center`}
              >
                <div className="text-4xl font-bold mb-2">{p.letter}</div>
                <div className="font-bold text-lg mb-1">{p.word}</div>
                <div className="text-sm opacity-90">{p.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* All 17 Goals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">The 17 Sustainable Development Goals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sdgs.map((sdg, index) => (
              <motion.div
                key={sdg.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className={`bg-gradient-to-r ${sdg.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">#{sdg.number}</div>
                    <div className="text-4xl">{sdg.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold mt-2">{sdg.title}</h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-700">{sdg.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Why They Matter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-lg p-8 mt-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Why Do the SDGs Matter?</h2>
          <div className="space-y-3 text-gray-700 text-lg">
            <p>
              <strong>🌍 Global Challenges:</strong> The SDGs address the most pressing challenges facing our world today, from climate change to inequality.
            </p>
            <p>
              <strong>🤝 Universal Goals:</strong> They apply to all countries, rich and poor, and require action from governments, businesses, and individuals.
            </p>
            <p>
              <strong>🔗 Interconnected:</strong> The goals are interconnected - progress in one area supports progress in others.
            </p>
            <p>
              <strong>👥 Everyone's Responsibility:</strong> Achieving the SDGs requires everyone to take action - including young people like you!
            </p>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="text-center mt-12"
        >
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to Make a Difference?</h2>
          <p className="text-xl text-gray-700 mb-8">
            Create an animated movie about an SDG that matters to you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/studio">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Start Creating Your Movie 🎬
              </motion.button>
            </Link>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-600 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Back to Home 🏠
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Learn More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="mt-12 text-center text-gray-600"
        >
          <p className="mb-2">Learn more about the SDGs:</p>
          <a
            href="https://www.un.org/sustainabledevelopment/sustainable-development-goals/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Official UN SDGs Website →
          </a>
        </motion.div>
      </div>
    </div>
  )
}

