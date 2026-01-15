# Signup System Setup Guide

## Overview
Complete user signup system with MySQL database integration, secure password hashing, and form validation.

## Files Created

1. **Frontend:**
   - `app/signup/page.jsx` - Signup form page

2. **Backend:**
   - `app/api/signup/route.js` - Signup API endpoint

3. **Database:**
   - `lib/db.js` - Database connection utilities
   - `database/schema.sql` - SQL schema for users table

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `bcryptjs` - For password hashing
- `mysql2` - MySQL database driver

### 2. Set Up MySQL Database

#### Option A: Using MySQL Command Line

```bash
mysql -u root -p
```

Then run:
```sql
source database/schema.sql
```

#### Option B: Using phpMyAdmin or MySQL Workbench

1. Open phpMyAdmin or MySQL Workbench
2. Create a new database named `ai_social_impact`
3. Import the `database/schema.sql` file

### 3. Configure Environment Variables

Create or update `.env.local` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_social_impact

# Existing Luma API
LUMA_API_KEY=your_luma_api_key_here
```

**Important:** Replace `your_mysql_password` with your actual MySQL root password.

### 4. Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/signup`

3. Fill out the form and test registration

## Database Schema

The `users` table includes:
- `id` - Auto-increment primary key
- `full_name` - User's full name
- `email` - Unique email address
- `phone` - Phone number
- `password_hash` - Bcrypt hashed password (never plain text)
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp
- `status` - Account status (active/inactive/suspended)

## Security Features

✅ **Password Hashing:** Uses bcrypt with 10 salt rounds
✅ **SQL Injection Protection:** All queries use prepared statements
✅ **Input Validation:** Server-side validation for all fields
✅ **Email Uniqueness:** Prevents duplicate registrations
✅ **Error Handling:** Comprehensive error messages

## API Endpoint

**POST** `/api/signup`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": 1
}
```

**Error Response (400/409/500):**
```json
{
  "error": "Error message",
  "field": "email" // Optional: indicates which field has error
}
```

## Troubleshooting

### Database Connection Error

1. Verify MySQL is running:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl start mysql
   ```

2. Check credentials in `.env.local`

3. Verify database exists:
   ```sql
   SHOW DATABASES;
   USE ai_social_impact;
   SHOW TABLES;
   ```

### "Module not found" Error

Run:
```bash
npm install bcryptjs mysql2
```

### Port Already in Use

Change the port in `package.json` or kill the process using port 3000.

## Production Deployment

**Important:** For static export (GoDaddy), API routes won't work. You'll need:

1. **Option 1:** Deploy backend separately (Node.js server, Vercel, etc.)
2. **Option 2:** Use serverless functions (Vercel, Netlify)
3. **Option 3:** Use a third-party authentication service (Auth0, Firebase Auth)

For GoDaddy static hosting, consider:
- Using a separate backend API server
- Using GoDaddy's hosting with PHP/Node.js support
- Using a cloud database service (PlanetScale, AWS RDS)

## Next Steps

1. Create login functionality (`/app/login/page.jsx`)
2. Add session management
3. Add email verification
4. Add password reset functionality
