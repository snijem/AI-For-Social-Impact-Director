# AI For Social Impact : AI Youth Directors

An interactive web application where students can create AI-generated animated movies about Sustainable Development Goals (SDGs).

## Features

- 🎬 **Script Studio**: Write scripts with AI tips and guidance
- ✨ **AI Video Generation**: Generate animated videos using Luma Dream Machine
- 👤 **User Authentication**: Sign up, login, and manage your account
- 📊 **Progress Tracking**: Real-time progress updates during video generation
- 🎥 **Video Merging**: Automatically merges multiple clips into one continuous video
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful design with Framer Motion animations

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create `.env.local` file (see [SETUP.md](./SETUP.md) for details)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Express.js (optional)
- **Database:** MySQL with connection pooling
- **Video Generation:** Luma Dream Machine API
- **Authentication:** Session-based with bcrypt password hashing

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup and configuration guide
- **[README.md](./README.md)** - This file

## Project Structure

```
AI For Social Impact Director/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── studio/            # Video creation studio
│   ├── result/            # Video result page
│   └── sdgs/              # SDGs information page
├── components/            # React components
├── contexts/              # React contexts (Auth)
├── lib/                   # Utility libraries
│   ├── db.js             # Database connection (Next.js)
│   ├── db-express.js     # Database connection (Express)
│   ├── auth.js           # Authentication utilities
│   ├── video-worker.js   # Video generation worker
│   └── video-merger.js   # Video merging utility
├── database/              # SQL schema files
├── public/                # Static assets
└── server.js              # Express server (optional)
```

## How It Works

1. **Sign Up/Login:** Create an account or log in
2. **Write Script:** Go to Script Studio and write your story (minimum 60 characters)
3. **Generate Video:** Click "Generate Animation" to create your video
4. **Watch Progress:** See real-time progress as your video is generated
5. **View Result:** Watch your completed video on the result page

## Build for Production

```bash
npm run build
npm start
```

## Requirements

- Node.js 16+
- MySQL server
- FFmpeg (optional, for video merging)
- Luma API key (for video generation)

## License

Private project

