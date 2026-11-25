import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CheckIn } from '../db'

type Headache = CheckIn['headache']
const headaches: Headache[] = ['none', 'mild', 'bad']

/** Ten-second daily check-in. Shows trends only, never interprets them. */
export function CheckInCard({ date }: { date: string }) {
  const saved = useLiveQuery(() => db.checkIns.get(date), [date])
  const [editing, setEditing] = useState(false)
  const [pain, setPain] = useState<number | undefined>()
  const [headache, setHeadache] = useState<Headache>('none')
  const [arm, setArm] = useState(false)

  useEffect(() => {
    if (!saved) return
    setPain(saved.painRightNeckShoulder)
    setHeadache(saved.headache)
    setArm(saved.armFatigueOrTingling)
  }, [saved])

  async function save() {
    if (pain === undefined) return
    await db.checkIns.put({ date, painRightNeckShoulder: pain, headache, armFatigueOrTingling: arm })
    setEditing(false)
  }

  if (saved && !editing) {
    return (
      <section className="checkin checkin-done" aria-label="Today's check-in">
        <div>
          <p className="label">Check-in</p>
          <p className="mono checkin-summary">
            Pain {saved.painRightNeckShoulder} · Headache {saved.headache} · Arm {saved.armFatigueOrTingling ? 'yes' : 'no'}
          </p>
        </div>
        <button className="btn-quiet checkin-edit" onClick={() => setEditing(true)}>Edit</button>
      </section>
    )
  }

  return (
    <section className="checkin" aria-label="Daily check-in">
      <p className="label">Check-in</p>

      <fieldset className="checkin-q">
        <legend>Right neck and shoulder pain</legend>
        <div className="pain-grid" role="radiogroup" aria-label="Pain from 0 to 10">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              role="radio"
              aria-checked={pain === n}
              className="choice mono"
              onClick={() => setPain(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="checkin-q">
        <legend>Headache</legend>
        <div className="choice-row" role="radiogroup" aria-label="Headache">
          {headaches.map((h) => (
            <button key={h} role="radio" aria-checked={headache === h} className="choice" onClick={() => setHeadache(h)}>
              {h}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="checkin-q">
        <legend>Right arm fatigue or tingling</legend>
        <div className="choice-row" role="radiogroup" aria-label="Right arm fatigue or tingling">
          {[false, true].map((v) => (
            <button key={String(v)} role="radio" aria-checked={arm === v} className="choice" onClick={() => setArm(v)}>
              {v ? 'yes' : 'no'}
            </button>
          ))}
        </div>
      </fieldset>

      <button className="btn-solid checkin-save" onClick={save} disabled={pain === undefined}>
        {pain === undefined ? 'Pick a pain number' : 'Save check-in'}
      </button>
    </section>
  )
}
