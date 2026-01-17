import { cookies } from 'next/headers'
import crypto from 'crypto'
import { queryDB } from './db'

// Generate a secure random session token
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Create a session for a user
export async function createSession(userId) {
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

  // Insert session into database
  await queryDB(
    'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )

  return { token, expiresAt }
}

// Verify and get user from session token
export async function verifySession(token) {
  if (!token) return null

  const sessions = await queryDB(
    'SELECT user_id, expires_at FROM user_sessions WHERE session_token = ? AND expires_at > NOW()',
    [token]
  )

  if (!sessions || sessions.length === 0) {
    return null
  }

  const session = sessions[0]
  return session.user_id
}

// Delete a session
export async function deleteSession(token) {
  if (!token) return
  await queryDB('DELETE FROM user_sessions WHERE session_token = ?', [token])
}

// Get user from request (server-side)
export async function getCurrentUser(request = null) {
  try {
    let token = null
    
    // Try to get token from cookies (Next.js 15+)
    try {
      const cookieStore = await cookies()
      token = cookieStore.get('session_token')?.value
    } catch (cookieError) {
      // If cookies() fails, try to get from request headers
      if (request) {
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
          const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {})
          token = cookies['session_token']
        }
      }
    }
    
    if (!token) return null

    const userId = await verifySession(token)
    if (!userId) return null

    const users = await queryDB('SELECT id, full_name, email, phone, age, created_at FROM users WHERE id = ? AND status = ?', [userId, 'active'])
    
    if (!users || users.length === 0) return null
    
    return users[0]
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
