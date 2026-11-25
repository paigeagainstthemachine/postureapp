import { shoppingList } from '../data'
import { href } from '../router'

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function Equipment() {
  const byPhase = [1, 2].map((phase) => ({
    phase,
    items: shoppingList.items.filter((i) => i.phase === phase),
  }))

  return (
    <>
      <a className="back" href={href({ name: 'library' })}>Library</a>
      <p className="label">Budget ${shoppingList.budget_usd}</p>
      <h1>Equipment</h1>
      <p className="muted">
        {shoppingList.note}
      </p>

      {byPhase.map(({ phase, items }) => (
        <section key={phase}>
          <h2>Phase {phase}</h2>
          <ul className="equipment-list">
            {items.map((item) => (
              <li key={item.name} className="equipment-item">
                <div className="equipment-head">
                  <span className="equipment-name">{item.name}</span>
                  <span className="price">${item.approx_usd}</span>
                </div>
                <div className="equipment-links">
                  {item.links.map((l) => (
                    <a key={l} href={l} target="_blank" rel="noreferrer">
                      {hostOf(l)}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="muted">Ticking off what you own and the running total arrive with on-device storage.</p>
    </>
  )
}
