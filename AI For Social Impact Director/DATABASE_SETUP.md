# Database Setup Instructions

## Quick Setup Guide

### Step 1: Install MySQL
Make sure MySQL is installed and running on your system.

**Windows:**
```bash
# Check if MySQL is running
net start MySQL80

# Or start it
net start MySQL80
```

**Mac (using Homebrew):**
```bash
brew services start mysql
```

**Linux:**
```bash
sudo systemctl start mysql
```

### Step 2: Create Database and Table

**Option A: Using MySQL Command Line**

1. Open terminal/command prompt
2. Login to MySQL:
   ```bash
   mysql -u root -p
   ```
   (Enter your MySQL root password when prompted)

3. Run the schema file:
   ```sql
   source database/schema.sql
   ```
   Or copy and paste the contents of `database/schema.sql` into MySQL

**Option B: Using phpMyAdmin**

1. Open phpMyAdmin in your browser (usually `http://localhost/phpmyadmin`)
2. Click on "SQL" tab
3. Copy the contents of `database/schema.sql`
4. Paste and click "Go"

**Option C: Using MySQL Workbench**

1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `database/schema.sql`
4. Click the execute button (⚡)

### Step 3: Configure Environment Variables

Create or edit `.env.local` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=ai_social_impact
```

**Important:** Replace `your_mysql_root_password` with your actual MySQL root password.

### Step 4: Test Connection

Restart your Next.js dev server:
```bash
npm run dev
```

Try signing up at `http://localhost:3000/signup`

## Troubleshooting

### Error: "Database server is not running"
- **Solution:** Start MySQL service
  - Windows: `net start MySQL80`
  - Mac: `brew services start mysql`
  - Linux: `sudo systemctl start mysql`

### Error: "Database access denied"
- **Solution:** Check your `.env.local` file
  - Verify `DB_USER` and `DB_PASSWORD` are correct
  - Make sure there are no extra spaces
  - Try resetting MySQL root password if needed

### Error: "Database does not exist"
- **Solution:** Run the schema.sql file to create the database
  ```bash
  mysql -u root -p < database/schema.sql
  ```

### Error: "Table doesn't exist"
- **Solution:** The users table wasn't created. Run:
  ```sql
  USE ai_social_impact;
  CREATE TABLE users (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  ```

### Can't find .env.local file
- **Solution:** Create it in the project root directory (same level as `package.json`)
- Make sure it's named exactly `.env.local` (with the dot at the beginning)

### Port 3306 is already in use
- **Solution:** MySQL is already running, or another service is using that port
- Check MySQL status and stop conflicting services

## Verify Database Setup

Run this SQL query to verify:
```sql
USE ai_social_impact;
SHOW TABLES;
SELECT * FROM users;
```

You should see the `users` table listed.

## For Production/GoDaddy

**Important:** For static export (GoDaddy), you'll need:
1. A separate database server (not localhost)
2. Update `DB_HOST` to your production database host
3. Or use a cloud database service (PlanetScale, AWS RDS, etc.)
