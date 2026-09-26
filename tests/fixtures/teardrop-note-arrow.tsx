/** Snapshot annotation in board-world mm: +X right, +Y up. Both ends are
 * positions; the arrow belongs to the PCB note layer and adds no copper.
 */
export function TeardropNoteArrow({
  from,
  to,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
}) {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const dx = (to.x - from.x) / length
  const dy = (to.y - from.y) / length
  const headLength = 0.3
  const headWidth = 0.14
  return (
    <>
      <pcbnoteline
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        strokeWidth={0.045}
        color="#a8d8ff"
      />
      <pcbnotepath
        strokeWidth={0.045}
        color="#a8d8ff"
        route={[
          {
            x: to.x - dx * headLength - dy * headWidth,
            y: to.y - dy * headLength + dx * headWidth,
          },
          to,
          {
            x: to.x - dx * headLength + dy * headWidth,
            y: to.y - dy * headLength - dx * headWidth,
          },
        ]}
      />
    </>
  )
}
