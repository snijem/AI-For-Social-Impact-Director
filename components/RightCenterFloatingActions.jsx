'use client'

import HeartAboutButton from './HeartAboutButton'
import TrophyOscarButton from './TrophyOscarButton'

export default function RightCenterFloatingActions() {
  return (
    <div
      className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center"
      style={{
        gap: '14px', // ~14px spacing between buttons
      }}
    >
      <HeartAboutButton />
      <TrophyOscarButton />
    </div>
  )
}

