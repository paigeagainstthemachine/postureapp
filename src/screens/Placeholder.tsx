export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <>
      <header className="screen-head">
        <h1>{title}</h1>
      </header>
      <p className="muted">{body}</p>
    </>
  )
}
