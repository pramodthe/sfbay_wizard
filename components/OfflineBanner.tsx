import React from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <WifiOff className="h-5 w-5" />
          <p className="text-sm font-medium">
            You are currently offline. Some features may be unavailable. Data shown is from your last session.
          </p>
        </div>
      </div>
    </div>
  )
}
