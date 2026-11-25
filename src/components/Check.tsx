/** Thin geometric check mark. Takes the box's text color; size is set in CSS. */
export function Check() {
  return (
    <svg className="check-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polyline points="5.5,12.5 10,17 18.5,7.5" />
    </svg>
  )
}
