# MySQL Database Connection Setup

This guide explains how to set up the MySQL database connection for the Next.js application.

## Files Created

1. **`lib/db.js`** - Reusable database connection module
2. **`app/api/test-db/route.js`** - API route to test database connection

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=signup_db
```

## Features

### ✅ Singleton Connection Pool
- Prevents multiple connections by reusing the same pool
- Automatically manages connection lifecycle
- Configurable connection limits

### ✅ Async/Await Support
- All functions use async/await for clean code
- Proper error handling throughout

### ✅ Prepared Statements
- All queries use prepared statements to prevent SQL injection
- Safe parameter binding

### ✅ Auto Database Creation
- Automatically creates the database if it doesn't exist
- No manual setup required

## Usage

### Basic Query

```javascript
import { queryDB } from '@/lib/db'

// Simple query
const users = await queryDB('SELECT * FROM users WHERE id = ?', [1])

// Insert query
const result = await queryDB(
  'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
  ['John Doe', 'john@example.com', '1234567890', 'hashed_password']
)
```

### Test Connection

Visit: `http://localhost:3000/api/test-db`

**GET Request** - Tests connection and checks if users table exists
**POST Request** - Creates users table if it doesn't exist

### Manual Connection Test

```javascript
import { connectDB, testConnection } from '@/lib/db'

// Test connection
const result = await testConnection()
console.log(result)
```

## API Routes

### GET `/api/test-db`
Tests the database connection and returns status.

**Response:**
```json
{
  "success": true,
  "message": "Database connection successful",
  "database": {
    "name": "signup_db",
    "host": "localhost",
    "port": 3306,
    "connected": true
  },
  "usersTable": {
    "exists": true,
    "userCount": 0,
    "error": null
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST `/api/test-db`
Creates the users table if it doesn't exist.

**Response:**
```json
{
  "success": true,
  "message": "Users table created/verified successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Functions Available

### `connectDB()`
Connects to the database and creates it if it doesn't exist.

### `queryDB(query, params)`
Execute a query with prepared statements.

### `getConnection()`
Get a connection from the pool (for transactions). Remember to release it!

### `testConnection()`
Test the database connection.

### `closeDB()`
Close all database connections (useful for cleanup).

## Error Handling

All functions throw errors that can be caught:

```javascript
try {
  const users = await queryDB('SELECT * FROM users')
} catch (error) {
  console.error('Database error:', error.message)
  // Handle error
}
```

## Troubleshooting

### Connection Refused
- Make sure MySQL is running
- Check DB_HOST and DB_PORT in `.env.local`

### Access Denied
- Verify DB_USER and DB_PASSWORD are correct
- Check MySQL user permissions

### Database Not Found
- The system will auto-create the database
- Or manually create: `CREATE DATABASE signup_db;`

### Table Not Found
- Use POST `/api/test-db` to create the users table
- Or run the SQL schema manually

## Example Usage in API Route

```javascript
import { NextResponse } from 'next/server'
import { queryDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await queryDB('SELECT * FROM users LIMIT 10')
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```
