const express = require('express')
const cors = require('cors')
// Load environment variables silently
require('dotenv').config({ path: '.env.local', debug: false })

const { connectDB, testConnection, queryDB, isConnected } = require('./lib/db-express')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Root endpoint - API information
app.get('/', (req, res) => {
  console.log('Root route hit!')
  res.json({
    success: true,
    message: 'Express + MySQL API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health - Server health check',
      testDb: 'GET /test-db - Test database connection',
      setupDb: 'POST /setup-db - Create users table',
      users: 'GET /api/users - Get all users',
    },
    timestamp: new Date().toISOString(),
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Test database connection endpoint
app.get('/test-db', async (req, res) => {
  try {
    // Test connection
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: connectionTest.message,
        errorCode: connectionTest.error,
        timestamp: new Date().toISOString(),
      })
    }

    // Try to query the users table
    let tableExists = false
    let userCount = 0
    let tableError = null

    try {
      // Check if users table exists and get count
      const users = await queryDB('SELECT COUNT(*) as count FROM users')
      tableExists = true
      userCount = users[0]?.count || 0
    } catch (error) {
      tableError = error.message
      // Table might not exist yet, which is okay
    }

    res.json({
      success: true,
      message: 'Database connection successful',
      database: {
        name: connectionTest.database,
        host: connectionTest.host,
        port: connectionTest.port,
        connected: true,
      },
      usersTable: {
        exists: tableExists,
        userCount: userCount,
        error: tableError,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Test DB error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to test database connection',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
    })
  }
})

// Create users table endpoint (for setup)
app.post('/setup-db', async (req, res) => {
  try {
    // Ensure connection
    await connectDB()

    // Create users table if it doesn't exist
    await queryDB(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    res.json({
      success: true,
      message: 'Users table created/verified successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Create table error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create users table',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
    })
  }
})

// Example: Get all users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await queryDB('SELECT id, full_name, email, phone, created_at, status FROM users LIMIT 100')
    res.json({
      success: true,
      count: users.length,
      users: users,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  })
})

// Initialize database connection and start server
async function startServer() {
  try {
    // Connect to database
    console.log('Connecting to MySQL database...')
    try {
      await connectDB()
      console.log('✅ Database connection established')
    } catch (dbError) {
      console.error('⚠️  Database connection failed:', dbError.message)
      console.error('⚠️  Server will start without database. Some features may not work.')
      console.error('')
      console.error('To fix this:')
      console.error('1. Install MySQL: https://dev.mysql.com/downloads/installer/')
      console.error('2. Or use XAMPP: https://www.apachefriends.org/')
      console.error('3. Or configure a cloud database in .env.local')
      console.error('')
    }

    // Start Express server (even if DB connection failed)
    app.listen(PORT, () => {
      console.log(`🚀 Express server running on http://localhost:${PORT}`)
      console.log(`📊 Root: http://localhost:${PORT}/`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      if (isConnected()) {
        console.log(`🔌 Test DB: http://localhost:${PORT}/test-db`)
        console.log(`📝 Setup DB: POST http://localhost:${PORT}/setup-db`)
      }
      console.log('✅ All routes registered successfully')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  const { closeDB } = require('./lib/db-express')
  await closeDB()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...')
  const { closeDB } = require('./lib/db-express')
  await closeDB()
  process.exit(0)
})

// Start the server
startServer()
