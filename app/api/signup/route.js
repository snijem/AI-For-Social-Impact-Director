import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB, queryDB } from '@/lib/db'
import { createSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { setupDatabase } from '@/lib/setup-db'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  // Wrap everything to ensure we always return JSON, never HTML error pages
  try {
    // Ensure database tables exist (fail silently if it doesn't work)
    try {
      await setupDatabase()
    } catch (setupError) {
      console.error('Database setup error (continuing anyway):', setupError.message)
      // Continue anyway - tables might already exist or will be created on first query
    }

    // Parse request body with error handling
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format. Please check your input.', field: 'general' },
        { status: 400 }
      )
    }

    const { fullName, email, phone, age, country, password } = body

    // Validation
    if (!fullName || !email || !phone || !age || !country || !password) {
      return NextResponse.json(
        { error: 'All fields are required', field: 'general' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', field: 'email' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long', field: 'password' },
        { status: 400 }
      )
    }

    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format', field: 'phone' },
        { status: 400 }
      )
    }

    // Age validation
    const ageNum = parseInt(age)
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return NextResponse.json(
        { error: 'Please enter a valid age (1-150)', field: 'age' },
        { status: 400 }
      )
    }

    // Country validation
    if (!country || country.trim().length === 0) {
      return NextResponse.json(
        { error: 'Country is required', field: 'country' },
        { status: 400 }
      )
    }

    // Check if email already exists
    try {
      const checkEmailQuery = 'SELECT id FROM users WHERE email = ?'
      const existingUser = await queryDB(checkEmailQuery, [email.toLowerCase()])

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered. Please use a different email or log in.', field: 'email' },
          { status: 409 }
        )
      }
    } catch (dbError) {
      console.error('Database query error:', dbError)
      // Continue - might be a connection issue, but we'll try to create the user anyway
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert user into database
    try {
      const insertQuery = `
        INSERT INTO users (full_name, email, phone, age, country, password_hash, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 'active')
      `
      
      const result = await queryDB(insertQuery, [
        fullName.trim(),
        email.toLowerCase().trim(),
        phone.trim(),
        ageNum,
        country.trim(),
        passwordHash
      ])

      if (result && result.insertId) {
        // Automatically log in the user after signup
        try {
          const { token, expiresAt } = await createSession(result.insertId)

          // Set cookie
          const cookieStore = await cookies()
          cookieStore.set('session_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
          })
        } catch (sessionError) {
          console.error('Error creating session:', sessionError)
          // Continue anyway - user account is created, session can be created on next login
        }

        return NextResponse.json(
          {
            success: true,
            message: 'Account created successfully',
            userId: result.insertId,
            user: {
              id: result.insertId,
              fullName: fullName.trim(),
              email: email.toLowerCase().trim(),
            },
          },
          { 
            status: 201,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      } else {
        throw new Error('Failed to create user account - no insert ID returned')
      }
    } catch (dbError) {
      console.error('Database insert error:', dbError)
      
      // Handle specific database errors
      if (dbError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            error: 'Database server is not running. Please start MySQL and check your database configuration.', 
            field: 'general' 
          },
          { status: 500 }
        )
      }

      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ER_ACCESS_DENIED') {
        return NextResponse.json(
          { 
            error: 'Database access denied. Please check your database credentials in .env.local file.', 
            field: 'general' 
          },
          { status: 500 }
        )
      }

      if (dbError.code === 'ER_BAD_DB_ERROR') {
        return NextResponse.json(
          { 
            error: 'Database does not exist. The system will try to create it automatically.', 
            field: 'general' 
          },
          { status: 500 }
        )
      }

      if (dbError.code === 'ETIMEDOUT' || dbError.message?.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Database connection timeout. Please check if MySQL is running and accessible.', 
            field: 'general' 
          },
          { status: 500 }
        )
      }

      // Handle duplicate entry errors
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { error: 'Email already registered. Please use a different email.', field: 'email' },
          { status: 409 }
        )
      }

      // Handle table doesn't exist
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return NextResponse.json(
          { 
            error: 'Database table not found. Please run the setup-db endpoint or check database configuration.', 
            field: 'general' 
          },
          { status: 500 }
        )
      }

      // Generic database error
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Database error: ${dbError.message || 'Unknown error occurred'}`
        : 'Database error occurred. Please try again or contact support.'

      return NextResponse.json(
        { error: errorMessage, field: 'general' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

  } catch (error) {
    // Catch ANY error that might cause HTML error pages
    console.error('Unexpected error in signup route:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Always return JSON, never let Next.js return HTML error page
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please check the server console for details.',
        field: 'general',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}
