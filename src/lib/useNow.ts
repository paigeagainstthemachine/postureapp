import { useEffect, useState } from 'react'

/**
 * Re-renders on an interval while active and returns Date.now().
 * Timers compare against end timestamps, so they stay accurate even if the
 * browser throttles the interval.
 */
export function useNow(active: boolean, ms = 100): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [active, ms])
  return now
}
