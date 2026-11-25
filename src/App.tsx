import { useEffect } from 'react'
import { useRoute, href, type Route } from './router'
import { useSettings } from './db'
import { ReminderBanner } from './components/ReminderBanner'
import { Library } from './screens/Library'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Equipment } from './screens/Equipment'
import { Today } from './screens/Today'
import { Session } from './screens/Session'
import { Progress } from './screens/Progress'
import { Settings } from './screens/Settings'

const tabs: { label: string; route: Route; match: Route['name'][] }[] = [
  { label: 'Today', route: { name: 'today' }, match: ['today', 'settings'] },
  { label: 'Progress', route: { name: 'progress' }, match: ['progress'] },
  { label: 'Library', route: { name: 'library' }, match: ['library', 'exercise', 'equipment'] },
]

export function App() {
  const route = useRoute()
  const inSession = route.name === 'session' || route.name === 'quick'
  const { newbornMode } = useSettings()

  // Newborn mode restyles the whole app through one attribute.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-newborn', newbornMode)
  }, [newbornMode])

  return (
    <div className="app">
      {!inSession && <ReminderBanner />}
      <main className={inSession ? 'screen screen-session' : 'screen'}>
        {route.name === 'today' && <Today />}
        {route.name === 'session' && <Session />}
        {route.name === 'quick' && <Session quickId={route.id} />}
        {route.name === 'progress' && <Progress />}
        {route.name === 'settings' && <Settings />}
        {route.name === 'library' && <Library />}
        {route.name === 'exercise' && <ExerciseDetail id={route.id} />}
        {route.name === 'equipment' && <Equipment />}
      </main>

      {!inSession && (
      <nav className="tabbar" aria-label="Main">
        {tabs.map((t) => {
          const active = t.match.includes(route.name)
          return (
            <a key={t.label} href={href(t.route)} className="tab" aria-current={active ? 'page' : undefined}>
              {t.label}
            </a>
          )
        })}
      </nav>
      )}
    </div>
  )
}
