import { queryDB } from './db'

/**
 * Log a lives change for a user
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {number} params.previousLives - Lives before change
 * @param {number} params.newLives - Lives after change
 * @param {string} params.actionType - Type of action: 'decrement', 'admin_set', 'admin_reset', 'initial', 'refund'
 * @param {string} [params.reason] - Reason for the change
 * @param {number} [params.adminUserId] - Admin user ID if changed by admin
 * @param {string} [params.relatedJobId] - Related job ID if applicable
 * @returns {Promise<void>}
 */
export async function logLivesChange({
  userId,
  previousLives,
  newLives,
  actionType,
  reason = null,
  adminUserId = null,
  relatedJobId = null
}) {
  try {
    const changeAmount = newLives - previousLives
    
    await queryDB(
      `INSERT INTO lives_log 
       (user_id, previous_lives, new_lives, change_amount, action_type, reason, admin_user_id, related_job_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, previousLives, newLives, changeAmount, actionType, reason, adminUserId, relatedJobId]
    )
  } catch (error) {
    // Log error but don't throw - we don't want to break the main flow if logging fails
    console.error('[Lives Logger] Error logging lives change:', error)
  }
}

/**
 * Get lives log for a user
 * @param {number} userId - User ID
 * @param {number} [limit=50] - Maximum number of records to return
 * @returns {Promise<Array>} Array of log entries
 */
export async function getUserLivesLog(userId, limit = 50) {
  try {
    const logs = await queryDB(
      `SELECT 
        id, user_id, previous_lives, new_lives, change_amount, 
        action_type, reason, admin_user_id, related_job_id, created_at
       FROM lives_log 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    )
    return logs || []
  } catch (error) {
    console.error('[Lives Logger] Error fetching lives log:', error)
    return []
  }
}

/**
 * Get all lives logs (admin only)
 * @param {number} [limit=100] - Maximum number of records to return
 * @param {number} [userId] - Optional filter by user ID
 * @returns {Promise<Array>} Array of log entries
 */
export async function getAllLivesLogs(limit = 100, userId = null) {
  try {
    let query = `
      SELECT 
        l.id, l.user_id, l.previous_lives, l.new_lives, l.change_amount,
        l.action_type, l.reason, l.admin_user_id, l.related_job_id, l.created_at,
        u.email as user_email, u.full_name as user_name,
        a.email as admin_email, a.full_name as admin_name
      FROM lives_log l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN users a ON l.admin_user_id = a.id
    `
    const params = []
    
    if (userId) {
      query += ' WHERE l.user_id = ?'
      params.push(userId)
    }
    
    query += ' ORDER BY l.created_at DESC LIMIT ?'
    params.push(limit)
    
    const logs = await queryDB(query, params)
    return logs || []
  } catch (error) {
    console.error('[Lives Logger] Error fetching all lives logs:', error)
    return []
  }
}
