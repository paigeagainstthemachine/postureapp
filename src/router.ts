// Tiny hash router. Hash URLs work offline and on Vercel with no rewrite rules.
import { useEffect, useState } from 'react'

export type Route =
  | { name: 'today' }
  | { name: 'library' }
  | { name: 'exercise'; id: string }
  | { name: 'equipment' }
  | { name: 'progress' }
  | { name: 'session' }
  | { name: 'quick'; id: string }
  | { name: 'settings' }
  | { name: 'summary' }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  switch (parts[0]) {
    case 'library':
      return parts[1] ? { name: 'exercise', id: decodeURIComponent(parts[1]) } : { name: 'library' }
    case 'equipment':
      return { name: 'equipment' }
    case 'progress':
      return { name: 'progress' }
    case 'settings':
      return { name: 'settings' }
    case 'summary':
      return { name: 'summary' }
    case 'session':
      return parts[1] === 'quick' && parts[2]
        ? { name: 'quick', id: decodeURIComponent(parts[2]) }
        : { name: 'session' }
    default:
      return { name: 'today' }
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/'
    case 'library':
      return '#/library'
    case 'exercise':
      return `#/library/${encodeURIComponent(route.id)}`
    case 'equipment':
      return '#/equipment'
    case 'progress':
      return '#/progress'
    case 'session':
      return '#/session'
    case 'quick':
      return `#/session/quick/${encodeURIComponent(route.id)}`
    case 'settings':
      return '#/settings'
    case 'summary':
      return '#/summary'
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
