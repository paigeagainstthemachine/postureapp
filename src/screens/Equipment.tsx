import { useLiveQuery } from 'dexie-react-hooks'
import { Check } from '../components/Check'
import { db } from '../db'
import { shoppingList, type ShoppingItem } from '../data'
import { parseCount } from '../lib/plan'
import { href } from '../router'

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Items have no id in the data, so the name is the key. */
const keyOf = (item: ShoppingItem) => item.name

function money(min: number, max: number) {
  return min === max ? `$${min}` : `$${min}-${max}`
}

export function Equipment() {
  const owned = new Set((useLiveQuery(() => db.ownedEquipment.toArray()) ?? []).filter((o) => o.owned).map((o) => o.itemId))
  const byPhase = [1, 2].map((phase) => ({
    phase,
    items: shoppingList.items.filter((i) => i.phase === phase),
  }))

  const ownedItems = shoppingList.items.filter((i) => owned.has(keyOf(i)))
  const min = ownedItems.reduce((a, i) => a + parseCount(i.approx_usd).min, 0)
  const max = ownedItems.reduce((a, i) => a + parseCount(i.approx_usd).max, 0)
  const budget = shoppingList.budget_usd

  async function toggle(item: ShoppingItem) {
    const k = keyOf(item)
    if (owned.has(k)) await db.ownedEquipment.delete(k)
    else await db.ownedEquipment.put({ itemId: k, owned: true })
  }

  return (
    <>
      <a className="back" href={href({ name: 'library' })}>Library</a>
      <p className="label">Budget ${budget}</p>
      <h1>Equipment</h1>
      <p className="muted">{shoppingList.note}</p>

      <div className="stats">
        <div className="stat">
          <span className="label">Ticked</span>
          <span className="mono stat-n">{ownedItems.length ? money(min, max) : '$0'}</span>
        </div>
        <div className="stat">
          <span className="label">Budget left</span>
          <span className="mono stat-n">{ownedItems.length ? money(budget - max, budget - min) : `$${budget}`}</span>
        </div>
      </div>
      <p className="muted small">Tick what you own or have bought. Totals use the approximate prices.</p>

      {byPhase.map(({ phase, items }) => (
        <section key={phase}>
          <h2>Phase {phase}</h2>
          <ul className="equipment-list">
            {items.map((item) => {
              const on = owned.has(keyOf(item))
              return (
                <li key={item.name} className={on ? 'equipment-item is-owned' : 'equipment-item'}>
                  <div className="equipment-head">
                    <span className="equipment-name">{item.name}</span>
                    <span className="price">${item.approx_usd}</span>
                    <button
                      className="check-box equip-box"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={`I have the ${item.name}`}
                      onClick={() => toggle(item)}
                    >
                      {on ? <Check /> : null}
                    </button>
                  </div>
                  <div className="equipment-links">
                    {item.links.map((l) => (
                      <a key={l} href={l} target="_blank" rel="noreferrer">
                        {hostOf(l)}
                      </a>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
