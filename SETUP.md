# AI For Social Impact Director - Setup Guide

Complete setup guide for the AI Youth Directors application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [API Endpoints](#api-endpoints)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16+ installed
- MySQL server running
- FFmpeg installed (for video merging - optional)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install FFmpeg (optional, for video merging):**
   - Windows: Download from https://ffmpeg.org/download.html
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt-get install ffmpeg`

## Environment Configuration

Create `.env.local` file in the project root with:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=signup_db

# Luma API Key (for video generation)
LUMA_API_KEY=your_luma_api_key_here

# Express Server Port (optional)
PORT=3001
```

**Important Notes:**
- `DB_HOST` should be just `localhost` (not `http://localhost:3000`)
- MySQL uses port `3306` by default
- Port `3000` is for Next.js, port `3001` is for Express
- After modifying `.env.local`, restart the dev server

## Database Setup

### Option 1: Automatic Setup (Recommended)

The database tables are created automatically when you first use the API endpoints. The system will:
- Create the database if it doesn't exist
- Create all required tables (users, user_sessions, user_videos, generation_jobs)

### Option 2: Manual Setup

1. **Create MySQL user (if needed):**
   ```sql
   CREATE USER IF NOT EXISTS 'website_user'@'localhost' IDENTIFIED BY 'Ghostforlife-_-1';
   GRANT ALL PRIVILEGES ON signup_db.* TO 'website_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Run schema files:**
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/user_auth_schema.sql
   ```

## Running the Application

### Development Mode

**Terminal 1 - Next.js Frontend:**
```bash
npm run dev
```
Runs on `http://localhost:3000`

**Terminal 2 - Express Backend (optional):**
```bash
npm run server
```
Runs on `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth` - Check authentication status

### Video Generation
- `POST /api/generate` - Create video generation job (returns jobId immediately)
- `GET /api/job/[jobId]` - Get job status and results
- `POST /api/generate-video` - Direct video generation (legacy)

### Videos
- `GET /api/videos` - Get user's videos
- `GET /api/videos/[id]` - Get specific video
- `POST /api/videos` - Save video to database

### Health
- `GET /api/health` - Health check endpoint

## Project Structure

```
AI For Social Impact Director/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── studio/           # Video creation studio
│   ├── result/           # Video result page
│   └── sdgs/             # SDGs information page
├── components/           # React components
├── contexts/             # React contexts (Auth)
├── lib/                  # Utility libraries
│   ├── db.js            # Database connection (Next.js)
│   ├── db-express.js     # Database connection (Express)
│   ├── auth.js           # Authentication utilities
│   ├── video-worker.js   # Video generation worker
│   └── video-merger.js   # Video merging utility
├── database/             # SQL schema files
├── public/               # Static assets
└── server.js             # Express server
```

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
- Make sure MySQL is running:
  - Windows: `net start MySQL80`
  - Linux/Mac: `sudo systemctl start mysql`
- Check `DB_HOST` and `DB_PORT` in `.env.local`

**Error: "Access denied"**
- Verify `DB_USER` and `DB_PASSWORD` in `.env.local`
- Check MySQL user permissions

**Error: "Database not found"**
- The system will auto-create the database
- Or manually create: `CREATE DATABASE signup_db;`

### Luma API Issues

**Error: "Luma API key not configured"**
1. Check `.env.local` exists at project root
2. Verify variable name is exactly `LUMA_API_KEY` (case-sensitive)
3. Restart dev server after adding/modifying `.env.local`
4. Check for typos or extra spaces

**Error: "Video generation fails"**
- Check server console for `[Luma API]` error messages
- Verify API key is valid
- Check Luma API status

### Port Issues

**Port 3000 already in use:**
- Kill the process using port 3000
- Or change port in `package.json`: `"dev": "next dev -p 3002"`

**Port 3001 already in use:**
- Change `PORT` in `.env.local`
- Or kill the process using port 3001

### Video Merging Issues

**FFmpeg not found:**
- Install FFmpeg and add to PATH
- System will fall back to first video if FFmpeg unavailable

**Merge fails:**
- Check file permissions on `public/merged-videos/`
- Check server logs for merge errors
- Verify FFmpeg installation

## Security Notes

- ✅ `.env.local` is in `.gitignore` - credentials won't be committed
- ✅ All database queries use prepared statements (SQL injection protection)
- ✅ Passwords are hashed with bcrypt
- ✅ API keys are only accessed server-side
- ✅ Never expose sensitive keys to client (no `NEXT_PUBLIC_` prefix)

## Features

- ✅ User authentication (signup, login, logout)
- ✅ Video generation with Luma Dream Machine
- ✅ Async job-based processing (no timeouts)
- ✅ Video merging (7 clips into 1 continuous video)
- ✅ Story context extraction and locking
- ✅ Progress tracking
- ✅ Database persistence

## Next Steps

1. Set up environment variables in `.env.local`
2. Start MySQL server
3. Run `npm run dev` to start development server
4. Visit `http://localhost:3000` to use the application

