# AI For Social Impact: AI Youth Directors

An interactive web application where students can create AI-generated animated movies about Sustainable Development Goals (SDGs).

## Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [What You Need](#what-you-need)
4. [Installation](#installation)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Running the Application](#running-the-application)
8. [How It Works](#how-it-works)
9. [Troubleshooting](#troubleshooting)
10. [Summary](#summary)

## Features

- 🎬 **Script Studio**: Write scripts with AI tips and guidance
- ✨ **AI Video Generation**: Generate animated videos using Luma Dream Machine
- 👤 **User Authentication**: Sign up, login, and manage your account
- 📊 **Progress Tracking**: Real-time progress updates during video generation
- 🎥 **Video Merging**: Automatically merges multiple clips into one continuous video
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful design with Framer Motion animations
- ✅ **Async Job Processing**: No timeouts - jobs run in background
- ✅ **Story Context Extraction**: Intelligent storyboard generation
- ✅ **Database Persistence**: Save and manage your videos

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file** in the project root:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD="your_password"
   DB_NAME=signup_db
   LUMA_API_KEY=your_luma_api_key
   PORT=3001
   ```

3. **Open TWO terminal windows** and run BOTH commands:

   **Terminal 1:**
   ```bash
   npm run dev
   ```

   **Terminal 2:**
   ```bash
   npm run server
   ```

4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## What You Need

- **Node.js 16+** - [Download here](https://nodejs.org/)
- **MySQL Server** - [Download MySQL](https://dev.mysql.com/downloads/installer/) or [XAMPP](https://www.apachefriends.org/)
- **Luma API Key** - Get from [Luma AI](https://lumalabs.ai/)
- **FFmpeg** (optional) - Only needed if you want to merge multiple video clips into one

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install FFmpeg (optional):**
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - **Mac**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`
   
   > ⚠️ **Note:** FFmpeg is optional. Without it, you'll only see the first video clip instead of a merged video.

## Environment Configuration

Create a file named `.env.local` in the project root folder with this content:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="your_mysql_password"
DB_NAME=signup_db
LUMA_API_KEY=your_luma_api_key
PORT=3001
```

**Important:**
- Replace `your_mysql_password` with your actual MySQL password
- Replace `your_luma_api_key` with your actual Luma API key
- If your password has special characters like `$`, use double quotes: `DB_PASSWORD="password$here"`
- After creating or changing `.env.local`, restart both servers

## Database Setup

**The database sets itself up automatically!** 

Just make sure:
1. MySQL is running on your computer
2. Your `.env.local` file has the correct MySQL password

The app will create all needed tables the first time you use it. No manual setup needed!

## Running the Application

**You MUST run BOTH servers in separate terminals:**

### Step 1: Open Terminal 1
```bash
npm run dev
```
✅ This starts the frontend on `http://localhost:3000`

### Step 2: Open Terminal 2
```bash
npm run server
```
✅ This starts the backend on `http://localhost:3001`

**Both terminals must stay open while using the app!**

> 💡 **Tip:** Use `npm run server:dev` in Terminal 2 for auto-reload on code changes



## How It Works

1. **Sign Up/Login** - Create an account
2. **Write Script** - Write your story (at least 2 characters)
3. **Generate Video** - Click "Generate Animation"
4. **Watch Progress** - See your video being created in real-time
5. **View Result** - Watch your completed video!

## Troubleshooting

### Can't connect to database?
- Make sure MySQL is running
- Check your password in `.env.local` is correct
- Restart both servers after changing `.env.local`

### Video generation not working?
- Check your `LUMA_API_KEY` in `.env.local` is correct
- Make sure you have credits in your Luma account
- Restart both servers after changing `.env.local`

### Port already in use?
- Close other programs using ports 3000 or 3001
- Or change the port in `.env.local` (for port 3001)

### Need more help?
- Check the server console for error messages
- Make sure both `npm run dev` and `npm run server` are running
- Verify all settings in `.env.local` are correct

## Summary

**To run this app, you need:**
1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env.local` with your database and API keys
3. ✅ Run **TWO terminals**: `npm run dev` AND `npm run server`
4. ✅ Open browser to `http://localhost:3000`

That's it! 🎉