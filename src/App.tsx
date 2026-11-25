import { useRoute, href, type Route } from './router'
import { Library } from './screens/Library'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Equipment } from './screens/Equipment'
import { Placeholder } from './screens/Placeholder'
import { Today } from './screens/Today'
import { Session } from './screens/Session'

const tabs: { label: string; route: Route; match: Route['name'][] }[] = [
  { label: 'Today', route: { name: 'today' }, match: ['today'] },
  { label: 'Progress', route: { name: 'progress' }, match: ['progress'] },
  { label: 'Library', route: { name: 'library' }, match: ['library', 'exercise', 'equipment'] },
]

export function App() {
  const route = useRoute()
  const inSession = route.name === 'session' || route.name === 'quick'

  return (
    <div className="app">
      <main className={inSession ? 'screen screen-session' : 'screen'}>
        {route.name === 'today' && <Today />}
        {route.name === 'session' && <Session />}
        {route.name === 'quick' && <Session quickId={route.id} />}
        {route.name === 'progress' && (
          <Placeholder title="Progress" body="Check-ins, pain trend and weekly sessions arrive in milestone 3." />
        )}
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
