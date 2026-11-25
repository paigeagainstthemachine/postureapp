export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <>
      <header className="screen-head">
        <p className="label">Coming soon</p>
        <h1>{title}</h1>
      </header>
      <p className="muted">{body}</p>
    </>
  )
}
