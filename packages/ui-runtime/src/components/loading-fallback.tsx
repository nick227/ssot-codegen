/**
 * LoadingFallback
 * 
 * Displays while template configuration is loading.
 */

export function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-neutral-600">Loading template...</p>
      </div>
    </div>
  )
}

