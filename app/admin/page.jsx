'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'submissions'

  useEffect(() => {
    fetchUsers()
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      
      if (response.status === 401 || response.status === 403) {
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      console.error('Error fetching submissions:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/users')
      
      if (response.status === 401) {
        router.push('/login?redirect=/admin')
        return
      }
      
      if (response.status === 403) {
        setError('Access denied. You do not have admin privileges.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserLives = async (userId, newLives) => {
    try {
      setUpdatingUserId(userId)
      const response = await fetch(`/api/admin/users/${userId}/lives`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lives_remaining: newLives }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update lives')
      }

      const data = await response.json()
      
      // Update the user in the local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, lives_remaining: newLives } : u
        )
      )

      alert(`Successfully updated lives for ${data.user.email}`)
    } catch (err) {
      console.error('Error updating lives:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const resetLives = (userId) => {
    if (confirm('Reset this user\'s lives to 3?')) {
      updateUserLives(userId, 3)
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

  // Filter users based on search and status
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm)
    
    const matchesStatus =
      filterStatus === 'all' || u.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage users and view script submissions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/results')}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
              >
                📊 View All Results
              </button>
              <button
                onClick={() => {
                  fetchUsers()
                  fetchSubmissions()
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Refresh
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
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-2xl font-bold text-gray-800">{users.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Users with Lives</div>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => (u.lives_remaining || 0) > 0).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-gray-600">Submissions</div>
            <div className="text-2xl font-bold text-purple-600">
              {submissions.length}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl shadow-lg p-4 mb-6"
        >
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-2 font-semibold transition-colors ${
                activeTab === 'submissions'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📝 Submissions ({submissions.length})
            </button>
          </div>
        </motion.div>

        {/* Filters - Only show for users tab */}
        {activeTab === 'users' && (
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
                  placeholder="Search by name, email, or phone..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </motion.div>
        )}

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

        {/* Submissions Table */}
        {activeTab === 'submissions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Script</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        No submissions found
                      </td>
                    </tr>
                  ) : (
                    submissions.map((submission, index) => (
                      <motion.tr
                        key={submission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">{submission.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {submission.full_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{submission.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                          <div className="truncate" title={submission.script}>
                            {submission.script?.substring(0, 100)}
                            {submission.script?.length > 100 && '...'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {submission.status || 'submitted'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(submission.created_at)}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        {activeTab === 'users' && (
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Age</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Country</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Lives</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || filterStatus !== 'all' ? 'No users found matching your filters' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">{user.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.full_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.age || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.country || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            (user.lives_remaining || 0) > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.lives_remaining ?? 3}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'suspended'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="999"
                            defaultValue={user.lives_remaining ?? 3}
                            onBlur={(e) => {
                              const newValue = parseInt(e.target.value) || 0
                              if (newValue !== (user.lives_remaining ?? 3)) {
                                updateUserLives(user.id, newValue)
                              }
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:border-green-500"
                            disabled={updatingUserId === user.id}
                          />
                          <button
                            onClick={() => resetLives(user.id)}
                            disabled={updatingUserId === user.id}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reset to 3 lives"
                          >
                            {updatingUserId === user.id ? '...' : 'Reset'}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          {activeTab === 'users' 
            ? `Showing ${filteredUsers.length} of ${users.length} users`
            : `Showing ${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`
          }
        </motion.div>
      </div>
    </div>
  )
}
