# Server Ports Guide

## Two Servers, Two Ports

Your project has **two separate servers** that run on different ports:

### 1. Next.js Dev Server (Frontend)
- **Port:** `3000`
- **Command:** `npm run dev`
- **URL:** `http://localhost:3000`
- **Purpose:** Serves your React/Next.js frontend application

### 2. Express API Server (Backend)
- **Port:** `3001`
- **Command:** `npm run server`
- **URL:** `http://localhost:3001`
- **Purpose:** Serves your Express API endpoints and connects to MySQL

## How to Run Both Servers

### Option 1: Run in Separate Terminals (Recommended)

**Terminal 1 - Next.js Frontend:**
```bash
npm run dev
```
This starts Next.js on `http://localhost:3000`

**Terminal 2 - Express Backend:**
```bash
npm run server
```
This starts Express on `http://localhost:3001`

### Option 2: Run Both from Root Directory

From the root directory (`AI For Social Impact Director`):

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run server
```

## Quick Start Commands

### Start Next.js (Frontend)
```bash
npm run dev
```
Then visit: `http://localhost:3000`

### Start Express (Backend API)
```bash
npm run server
```
Then visit: `http://localhost:3001`

### Start Both (You need 2 terminals)
```bash
# Terminal 1
npm run dev

# Terminal 2 (new terminal)
npm run server
```

## Testing

### Test Next.js Frontend:
- Open: `http://localhost:3000`
- Should show your React application

### Test Express Backend:
- Open: `http://localhost:3001`
- Should show API information JSON
- Open: `http://localhost:3001/test-db`
- Should test database connection

## Troubleshooting

### Port 3000 Not Working
1. Make sure Next.js server is running: `npm run dev`
2. Check if port 3000 is already in use
3. Look for errors in the terminal

### Port 3001 Not Working
1. Make sure Express server is running: `npm run server`
2. Check if port 3001 is already in use
3. Check `.env.local` for database configuration

### Both Ports in Use
If you see "port already in use" errors:
- Find and kill the process using that port
- Or change the port in the configuration

## Port Configuration

### Change Next.js Port (default: 3000)
Edit `package.json`:
```json
"dev": "next dev -p 3002"
```

### Change Express Port (default: 3001)
Edit `.env.local`:
```env
PORT=3002
```

## Summary

- **Frontend (Next.js):** `http://localhost:3000` - Your website
- **Backend (Express):** `http://localhost:3001` - Your API

Both can run simultaneously without conflicts!
