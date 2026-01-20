'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'

export default function AdminResultsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/results')
      
      if (response.status === 401) {
        router.push('/login?redirect=/admin/results')
        return
      }
      
      if (response.status === 403) {
        setError('Access denied. You do not have admin privileges.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch results')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      console.error('Error fetching results:', err)
      setError(err.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'N/A'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Filter results based on search and status
  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.script?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.generation_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus =
      filterStatus === 'all' || result.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error && error.includes('Access denied')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:shadow-lg transition-shadow"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                All Video Results
              </h1>
              <p className="text-gray-600 mt-1">
                View all video generation results with user information and prompts
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchResults}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                ← Back to Admin
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                ← Home
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Total Results</div>
            <div className="text-2xl font-bold text-gray-800">{results.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {results.filter(r => r.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Processing</div>
            <div className="text-2xl font-bold text-blue-600">
              {results.filter(r => r.status === 'processing').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-600">
              {results.filter(r => r.status === 'failed').length}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-4 mb-6"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by prompt, user email, name, or generation ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Prompt/Script</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Video URL</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || filterStatus !== 'all' ? 'No results found matching your filters' : 'No results found'}
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result, index) => (
                    <motion.tr
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">{result.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {result.full_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{result.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                        <div className="break-words" title={result.script}>
                          {truncateText(result.script, 150)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(result.status)}`}
                        >
                          {result.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {result.video_url ? (
                          <a
                            href={result.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                            title={result.video_url}
                          >
                            {truncateText(result.video_url, 50)}
                          </a>
                        ) : (
                          <span className="text-gray-400">No video URL</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(result.created_at)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          Showing {filteredResults.length} of {results.length} results
        </motion.div>
      </div>
    </div>
  )
}
