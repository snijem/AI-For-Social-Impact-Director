# Database Configuration Information

## Your Database Credentials

Based on your Express setup requirements, here are your database configuration details:

### Environment Variables (`.env.local`)

Create or update `.env.local` file in the project root (`AI For Social Impact Director/`) with:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=website_user
DB_PASSWORD=Ghostforlife-_-1
DB_NAME=signup_db

# Optional: Express server port
PORT=3001
```

## Configuration Details

| Variable | Value | Description |
|----------|-------|-------------|
| **DB_HOST** | `localhost` | MySQL server hostname |
| **DB_PORT** | `3306` | MySQL default port |
| **DB_USER** | `website_user` | MySQL username |
| **DB_PASSWORD** | `Ghostforlife-_-1` | MySQL password |
| **DB_NAME** | `signup_db` | Database name |

## Default Values (if not set in .env.local)

If you don't set these in `.env.local`, the system will use:

| Variable | Default Value |
|----------|---------------|
| DB_HOST | `localhost` |
| DB_PORT | `3306` |
| DB_USER | `root` |
| DB_PASSWORD | `` (empty) |
| DB_NAME | `signup_db` |

## MySQL User Setup

You need to create the MySQL user with these credentials:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create the user
CREATE USER IF NOT EXISTS 'website_user'@'localhost' IDENTIFIED BY 'Ghostforlife-_-1';

-- Grant privileges
GRANT ALL PRIVILEGES ON signup_db.* TO 'website_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

## Database Connection Files

Your database configuration is used in:

1. **`lib/db.js`** - Next.js API routes (uses ES6 imports)
2. **`lib/db-express.js`** - Express server (uses CommonJS requires)

Both files use the same environment variables from `.env.local`.

## Connection Pool Settings

```javascript
{
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}
```

## Quick Test

### Test Next.js Database Connection:
```bash
# Visit in browser
http://localhost:3000/api/test-db
```

### Test Express Database Connection:
```bash
# Visit in browser
http://localhost:3001/test-db

# Or use curl
curl http://localhost:3001/test-db
```

## File Locations

- **Environment file:** `AI For Social Impact Director/.env.local`
- **Next.js DB config:** `AI For Social Impact Director/lib/db.js`
- **Express DB config:** `AI For Social Impact Director/lib/db-express.js`

## Important Notes

⚠️ **Security:**
- Never commit `.env.local` to git (it should be in `.gitignore`)
- Keep your database password secure
- Use strong passwords in production

⚠️ **Host Configuration:**
- `DB_HOST` should be just `localhost` (not `http://localhost:3000`)
- MySQL uses port `3306`, not `3000`
- Port `3000` is for Next.js, port `3001` is for Express

## Troubleshooting

### Connection Refused
- Make sure MySQL is running: `net start MySQL80` (Windows)
- Check if MySQL is listening on port 3306

### Access Denied
- Verify the user exists: `SELECT User FROM mysql.user WHERE User = 'website_user';`
- Check password is correct
- Ensure privileges are granted

### Database Not Found
- The system will auto-create `signup_db` if it doesn't exist
- Or manually create: `CREATE DATABASE signup_db;`
