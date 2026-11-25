// Sound, vibration and screen wake lock. Every cue is also shown on screen,
// so sessions work with the sound off.
import { useEffect } from 'react'

let ctx: AudioContext | null = null

/** Call from a tap. Browsers only allow audio after a user gesture. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

function tone(freq: number, startOffset: number, ms: number) {
  if (!ctx) return
  const t = ctx.currentTime + startOffset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + ms / 1000 + 0.02)
}

function buzz(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}

export const cue = {
  /** Start holding, or start a timer. */
  go() {
    tone(660, 0, 140)
    buzz(60)
  },
  /** Hold finished: relax. */
  release() {
    tone(990, 0, 120)
    buzz([40, 60, 40])
  },
  /** Soft metronome tick for auto pace. */
  tick() {
    tone(520, 0, 60)
  },
  /** A set, rest or spot timer is finished. */
  done() {
    tone(784, 0, 140)
    tone(1047, 0.16, 200)
    buzz([80, 80, 80])
  },
}

/** Keep the screen on while active. Re-acquired when the page becomes visible again. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) void lock.release()
      } catch {
        // Not allowed right now (battery saver, hidden tab). Fine.
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && acquire()
    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [active])
}
