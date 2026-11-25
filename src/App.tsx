import { useRoute, href, type Route } from './router'
import { Library } from './screens/Library'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Equipment } from './screens/Equipment'
import { Placeholder } from './screens/Placeholder'

const tabs: { label: string; route: Route; match: Route['name'][] }[] = [
  { label: 'Today', route: { name: 'today' }, match: ['today'] },
  { label: 'Progress', route: { name: 'progress' }, match: ['progress'] },
  { label: 'Library', route: { name: 'library' }, match: ['library', 'exercise', 'equipment'] },
]

export function App() {
  const route = useRoute()

  return (
    <div className="app">
      <main className="screen">
        {route.name === 'today' && (
          <Placeholder title="Today" body="Today's plan and the session player arrive in milestone 2." />
        )}
        {route.name === 'progress' && (
          <Placeholder title="Progress" body="Check-ins, pain trend and weekly sessions arrive in milestone 3." />
        )}
        {route.name === 'library' && <Library />}
        {route.name === 'exercise' && <ExerciseDetail id={route.id} />}
        {route.name === 'equipment' && <Equipment />}
      </main>

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
    </div>
  )
}
