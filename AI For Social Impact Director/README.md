# AI Youth Director for SDGs

An interactive browser-based mini game where students can create animated movies about Sustainable Development Goals.

## Features

- 🎬 **Script Studio**: Write scripts with AI tips and guidance
- ✨ **AI Animation Generator**: Simulated AI generation with progress tracking
- 🎉 **Success/Fail Modes**: Random outcomes with fun animations
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Beautiful UI**: Modern design with Framer Motion animations

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Framer Motion

## Project Structure

```
app/
  ├── page.jsx          # Home page
  ├── studio/
  │   └── page.jsx      # Script Studio page
  ├── result/
  │   └── page.jsx      # Result page (success/fail)
  └── layout.jsx        # Root layout
```

## How to Play

1. Click "Start a Movie 🎬" on the home page
2. Write your script in the Script Studio (minimum 60 characters)
3. Click "Generate Animation ✨"
4. Watch the AI generate your movie (with progress bar)
5. See your result - success or fail!

## Build for Production

```bash
npm run build
npm start
```

