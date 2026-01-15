# Express + MySQL Setup Guide

Production-ready Node.js + Express server with MySQL connection using mysql2.

## 📋 Prerequisites

- Node.js 16+ installed
- MySQL server running
- MySQL user created with proper permissions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note:** `express`, `mysql2`, `cors`, and `dotenv` are already in package.json. If you need to install separately:

```bash
npm install express mysql2 cors dotenv
```

### 2. Configure Environment Variables

Create or update `.env.local` file in the project root:

```env
# MySQL Database Configuration
# IMPORTANT: DB_HOST should be just the hostname/IP, NOT a URL
DB_HOST=localhost
DB_PORT=3306
DB_USER=website_user
DB_PASSWORD=Ghostforlife-_-1
DB_NAME=signup_db

# Optional: Express server port
PORT=3001
```

**⚠️ Important:** 
- `DB_HOST` should be `localhost` (not `http://localhost:3000`)
- MySQL uses port `3306` by default (not 3000)
- Port 3000 is for your Express server, port 3306 is for MySQL

### 3. Create MySQL User (if not exists)

Connect to MySQL as root and run:

```sql
CREATE USER IF NOT EXISTS 'website_user'@'localhost' IDENTIFIED BY 'Ghostforlife-_-1';
GRANT ALL PRIVILEGES ON signup_db.* TO 'website_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Start the Express Server

```bash
npm run server
```

Or with auto-reload (requires nodemon):

```bash
npm install -g nodemon
npm run server:dev
```

The server will start on `http://localhost:3001` (or the PORT you specified).

## 📁 Files Created

### 1. `server.js`
Express server with:
- Database connection initialization
- CORS enabled
- JSON body parsing
- Error handling middleware
- Graceful shutdown handling

### 2. `lib/db-express.js`
Reusable MySQL connection module with:
- Singleton connection pool (prevents multiple connections)
- Environment variable configuration
- Prepared statements (SQL injection protection)
- Comprehensive error handling
- Auto database creation

## 🔌 API Endpoints

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

### GET `/test-db`
Test database connection and check users table.

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

### POST `/setup-db`
Create users table if it doesn't exist.

**Response:**
```json
{
  "success": true,
  "message": "Users table created/verified successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET `/api/users`
Get all users (example endpoint).

**Response:**
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "created_at": "2024-01-15T10:00:00.000Z",
      "status": "active"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Security Features

✅ **Prepared Statements** - All queries use parameterized queries to prevent SQL injection
✅ **Environment Variables** - Sensitive credentials stored in `.env.local` (not committed to git)
✅ **Connection Pooling** - Efficient connection management
✅ **Error Handling** - Comprehensive error handling with helpful messages
✅ **Input Validation** - Basic query validation before execution

## 🛠️ Usage Examples

### Basic Query

```javascript
const { queryDB } = require('./lib/db-express')

// Select query
const users = await queryDB('SELECT * FROM users WHERE id = ?', [1])

// Insert query
const result = await queryDB(
  'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
  ['John Doe', 'john@example.com', '1234567890', 'hashed_password']
)
```

### Transaction Example

```javascript
const { getConnection } = require('./lib/db-express')

const connection = await getConnection()
try {
  await connection.beginTransaction()
  
  await connection.execute('INSERT INTO users ...', [...])
  await connection.execute('INSERT INTO user_sessions ...', [...])
  
  await connection.commit()
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}
```

## 🐛 Troubleshooting

### Connection Refused Error

**Error:** `ECONNREFUSED`

**Solutions:**
1. Make sure MySQL server is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. Check MySQL is listening on the correct port:
   ```bash
   netstat -an | grep 3306
   ```

3. Verify DB_HOST in `.env.local` is correct (should be `localhost`, not a URL)

### Access Denied Error

**Error:** `ER_ACCESS_DENIED_ERROR`

**Solutions:**
1. Verify MySQL user exists:
   ```sql
   SELECT User, Host FROM mysql.user WHERE User = 'website_user';
   ```

2. Check password is correct in `.env.local`

3. Grant proper permissions:
   ```sql
   GRANT ALL PRIVILEGES ON signup_db.* TO 'website_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Database Not Found

The system will automatically create the database if it doesn't exist. If it fails:

```sql
CREATE DATABASE IF NOT EXISTS signup_db;
```

### Port Already in Use

If port 3001 is already in use:

1. Change PORT in `.env.local`:
   ```env
   PORT=3002
   ```

2. Or kill the process using port 3001:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3001 | xargs kill
   ```

## 📝 Testing

### Test Database Connection

```bash
curl http://localhost:3001/test-db
```

Or open in browser: `http://localhost:3001/test-db`

### Setup Database Table

```bash
curl -X POST http://localhost:3001/setup-db
```

## 🚀 Production Deployment

### Environment Variables

Make sure to set these in your production environment:

```env
DB_HOST=your_production_db_host
DB_PORT=3306
DB_USER=your_production_user
DB_PASSWORD=your_secure_password
DB_NAME=signup_db
PORT=3001
```

### Process Manager

Use PM2 for production:

```bash
npm install -g pm2
pm2 start server.js --name express-api
pm2 save
pm2 startup
```

### Security Checklist

- [ ] Change default MySQL password
- [ ] Use strong passwords
- [ ] Enable SSL for MySQL connections (if remote)
- [ ] Restrict database user permissions
- [ ] Use environment variables (never hardcode credentials)
- [ ] Enable firewall rules
- [ ] Regular database backups
- [ ] Monitor connection pool usage

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [mysql2 Documentation](https://github.com/sidorares/node-mysql2)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 🎯 Next Steps

1. Test the connection: `GET /test-db`
2. Setup the database: `POST /setup-db`
3. Add your custom API routes
4. Implement authentication middleware
5. Add request validation
6. Set up logging
7. Configure CORS for your frontend domain

---

**Note:** This Express server runs on port 3001 by default to avoid conflicts with Next.js dev server (port 3000). You can change this in `.env.local`.
