const mysql = require('mysql2/promise')

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'signup_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Security: Enable SSL if needed (for production)
  // ssl: {
  //   rejectUnauthorized: false
  // }
}

// Singleton connection pool to prevent multiple connections
let pool = null

/**
 * Get or create the database connection pool
 * Prevents multiple connections by reusing the same pool
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
    console.log('MySQL connection pool created')
  }
  return pool
}

/**
 * Connect to MySQL database and create database if it doesn't exist
 * Uses connection pool for better performance
 */
async function connectDB() {
  try {
    // Validate environment variables
    if (!dbConfig.host || !dbConfig.user) {
      throw new Error(
        'Database configuration missing. Please set DB_HOST, DB_USER, and DB_PASSWORD in .env.local'
      )
    }

    // Sanitize host (remove http:// if present)
    let host = dbConfig.host
    if (host.startsWith('http://') || host.startsWith('https://')) {
      host = host.replace(/^https?:\/\//, '').split(':')[0]
      console.warn(`⚠️  Removed protocol from DB_HOST. Using: ${host}`)
    }

    // Create a temporary connection to create database if needed
    const tempConnection = await mysql.createConnection({
      host: host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    })

    // Create database if it doesn't exist
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``)
    await tempConnection.end()

    // Initialize connection pool with database
    if (!pool) {
      pool = mysql.createPool({
        ...dbConfig,
        host: host,
        database: dbConfig.database,
      })

      // Test the connection
      const testConnection = await pool.getConnection()
      await testConnection.ping()
      testConnection.release()

      console.log(`✅ Connected to MySQL database: ${dbConfig.database}`)
    }

    return pool
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    console.error('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password,
    })

    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot connect to MySQL server at ${dbConfig.host}:${dbConfig.port}. Make sure MySQL is running.`
      )
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_ACCESS_DENIED') {
      throw new Error('Access denied. Please check DB_USER and DB_PASSWORD in .env.local')
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Connection timeout. Check if MySQL server is accessible.')
    }

    throw error
  }
}

/**
 * Execute a query with prepared statements (prevents SQL injection)
 * @param {string} query - SQL query with ? placeholders
 * @param {Array} params - Parameters to replace ? placeholders
 * @returns {Promise<Array>} Query results
 */
async function queryDB(query, params = []) {
  try {
    // Ensure connection pool exists
    if (!pool) {
      await connectDB()
    }

    // Validate query (basic security check)
    if (typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: Query must be a non-empty string')
    }

    // Execute query with prepared statements
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error('❌ Query error:', error.message)
    console.error('Query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''))
    console.error('Params:', params.length > 0 ? '[' + params.length + ' params]' : 'none')

    // Re-throw with context
    const dbError = new Error(`Database query failed: ${error.message}`)
    dbError.originalError = error
    throw dbError
  }
}

/**
 * Get a connection from the pool (for transactions)
 * Remember to release it after use!
 * @returns {Promise<mysql.PoolConnection>}
 */
async function getConnection() {
  if (!pool) {
    await connectDB()
  }
  return await pool.getConnection()
}

/**
 * Close all database connections
 * Useful for cleanup or testing
 */
async function closeDB() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('Database connections closed')
  }
}

/**
 * Test database connection
 * @returns {Promise<Object>} Connection status
 */
async function testConnection() {
  try {
    if (!pool) {
      await connectDB()
    }

    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()

    return {
      success: true,
      message: 'Database connection successful',
      database: dbConfig.database,
      host: dbConfig.host.replace(/^https?:\/\//, '').split(':')[0],
      port: dbConfig.port,
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.code,
    }
  }
}

module.exports = {
  connectDB,
  queryDB,
  getConnection,
  testConnection,
  closeDB,
  getPool,
}
