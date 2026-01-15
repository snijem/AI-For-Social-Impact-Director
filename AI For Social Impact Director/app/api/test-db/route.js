import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/test-db
 * Test database connection and return status
 */
export async function GET() {
  // Always return JSON, never HTML
  try {
    // Dynamic import to catch module errors
    let dbModule
    try {
      dbModule = await import('@/lib/db')
    } catch (importError) {
      console.error('Failed to import db module:', importError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to load database module',
          error: importError.message || 'Module import error',
          errorName: importError.name,
        },
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { connectDB, testConnection, queryDB } = dbModule
    
    // Test connection
    const connectionTest = await testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed',
          error: connectionTest.message,
          errorCode: connectionTest.error,
        },
        { status: 500 }
      )
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

    return NextResponse.json(
      {
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
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Test DB error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test database connection',
        error: error.message || 'Unknown error',
        errorCode: error.code,
        errorName: error.name,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

/**
 * POST /api/test-db
 * Create users table if it doesn't exist (for testing)
 */
export async function POST() {
  // Always return JSON, never HTML
  try {
    // Dynamic import to catch module errors
    let dbModule
    try {
      dbModule = await import('@/lib/db')
    } catch (importError) {
      console.error('Failed to import db module:', importError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to load database module',
          error: importError.message || 'Module import error',
          errorName: importError.name,
        },
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { connectDB, queryDB } = dbModule
    
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

    return NextResponse.json(
      {
        success: true,
        message: 'Users table created/verified successfully',
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Create table error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create users table',
        error: error.message || 'Unknown error',
        errorCode: error.code,
        errorName: error.name,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
