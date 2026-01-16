'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'

export default function MyResults() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [resultLinks, setResultLinks] = useState([])
  const [loadingLinks, setLoadingLinks] = useState(true)

  // Fetch result links from database
  useEffect(() => {
    const fetchResultLinks = async () => {
      if (!user) {
        setLoadingLinks(false)
        return
      }

      try {
        setLoadingLinks(true)
        const response = await fetch('/api/result-links')
        if (response.ok) {
          const data = await response.json()
          setResultLinks(data.links || [])
        } else {
          console.error('Failed to fetch result links')
          setResultLinks([])
        }
      } catch (error) {
        console.error('Error fetching result links:', error)
        setResultLinks([])
      } finally {
        setLoadingLinks(false)
      }
    }

    if (!loading) {
      fetchResultLinks()
    }
  }, [user, loading])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
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
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-50 to-blue-50">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Login Required
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Please log in to view your saved result links
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Log In
              </motion.button>
            </Link>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Sign Up
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

  // Show result links if authenticated
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            My Result Links
          </h1>
          <p className="text-xl text-gray-700">
            All your saved video generation results
          </p>
        </motion.div>

        {loadingLinks ? (
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your result links...</p>
          </div>
        ) : resultLinks.length > 0 ? (
          <div className="space-y-6">
            {resultLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Video Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-bold text-2xl text-gray-800 mb-2">
                    {link.title || 'Generated Video'}
                  </h3>
                  {link.description && (
                    <p className="text-gray-600 mb-2">{link.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      Created: {new Date(link.created_at).toLocaleString()}
                    </span>
                    {link.updated_at !== link.created_at && (
                      <span>
                        Updated: {new Date(link.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Video Player */}
                <div className="relative w-full aspect-video bg-gray-100">
                  <video
                    src={link.result_url}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      try {
                        console.error('Video failed to load:', link.result_url)
                        if (e.target) {
                          e.target.style.display = 'none'
                          if (e.target.parentElement) {
                            e.target.parentElement.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                <p class="mb-2 text-lg">Video failed to load</p>
                                <p class="text-sm text-gray-400 mb-4 break-all">URL: ${link.result_url}</p>
                                <a href="${link.result_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                                  Try opening in new tab
                                </a>
                              </div>
                            `
                          }
                        }
                      } catch (err) {
                        console.error('Error handling video error:', err)
                      }
                    }}
                    onLoadedData={() => {
                      try {
                        console.log('Video loaded successfully:', link.result_url)
                      } catch (err) {
                        console.error('Error in video load handler:', err)
                      }
                    }}
                  >
                    Your browser does not support the video tag.
                    <a href={link.result_url} download>Download the video</a>
                  </video>
                </div>

                {/* Video Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                  <a
                    href={link.result_url}
                    download
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-6 rounded-full hover:shadow-lg transition-shadow"
                  >
                    <span>⬇️</span>
                    <span>Download Video</span>
                  </a>
                  <a
                    href={link.result_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <span>🔗</span>
                    <span>Open in New Tab</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl p-12 text-center"
          >
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Result Links Yet
            </h2>
            <p className="text-gray-600 mb-8">
              You haven't generated any videos yet. Create your first video to see your result links here!
            </p>
            <Link href="/studio">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
              >
                Go to Studio 🎬
              </motion.button>
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-4 justify-center flex-wrap"
        >
          <Link href="/studio">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl"
            >
              Create New Video 🎬
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

