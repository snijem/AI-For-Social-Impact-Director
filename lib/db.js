import mysql from 'mysql2/promise'
require('dotenv').config({ path: '.env.local' })

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
}

// Singleton connection pool to prevent multiple connections
let pool = null

/**
 * Get or create the database connection pool
 * Prevents multiple connections by reusing the same pool
 */
export function getPool() {
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
export async function connectDB() {
  try {
    // Validate environment variables
    if (!dbConfig.host || !dbConfig.user) {
      throw new Error(
        'Database configuration missing. Please set DB_HOST, DB_USER, and DB_PASSWORD in .env.local'
      )
    }

    // Create a temporary connection to create database if needed
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
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
    // Log config without exposing password
    console.error('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      hasPassword: !!dbConfig.password,
      passwordLength: dbConfig.password ,
    })
    
    // Debug: Check if password is being truncated (only in development)
    if (process.env.NODE_ENV === 'development' && dbConfig.password) {
      console.error('Password debug (first 3 chars):', dbConfig.password.substring(0, 3))
      console.error('Password debug (last 3 chars):', dbConfig.password.substring(Math.max(0, dbConfig.password.length - 3)))
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
export async function queryDB(query, params = []) {
  try {
    // Ensure connection pool exists
    if (!pool) {
      await connectDB()
    }

    // Execute query with prepared statements
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error('❌ Query error:', error.message)
    console.error('Query:', query)
    console.error('Params:', params)
    throw error
  }
}

/**
 * Get a connection from the pool (for transactions)
 * Remember to release it after use!
 * @returns {Promise<mysql.PoolConnection>}
 */
export async function getConnection() {
  if (!pool) {
    await connectDB()
  }
  return await pool.getConnection()
}

/**
 * Close all database connections
 * Useful for cleanup or testing
 */
export async function closeDB() {
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
export async function testConnection() {
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
      host: dbConfig.host,
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
