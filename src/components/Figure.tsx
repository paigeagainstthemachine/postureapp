import { figureUrl, type Exercise } from '../data'

export function Figure({ exercise, size = 'large' }: { exercise: Exercise; size?: 'small' | 'large' }) {
  const src = figureUrl(exercise)
  if (!src) return null
  // The name is shown next to every figure, so the image itself is decorative.
  return <img className={`figure figure-${size}`} src={src} alt="" />
}
