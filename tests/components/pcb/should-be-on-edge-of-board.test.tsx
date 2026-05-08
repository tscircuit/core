import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: `shouldBeOnEdgeOfBoard` is declared on `pcbLayoutProps`
// and shows up in TypeScript completion, but the auto-placer never
// read it — setting it on a chip / connector / through-hole was a
// no-op. This is the same shape of "documented prop the runtime
// ignores" bug as #2242 (`pcbPositionMode`, fixed in #2247) and
// #2270 (`<platedhole connectsTo>`).
//
// Snap semantics: pick whichever board edge is closest to the
// component's current `display_offset_x/y` (which reflects any
// explicit `pcbX`/`pcbY`), and shift only the perpendicular dimension
// so the courtyard touches that edge. The component's center is set
// directly so subsequent layout phases leave it put.

const probeChip = (name: string, extra: Record<string, unknown> = {}) => (
  <chip
    name={name}
    shouldBeOnEdgeOfBoard
    pinLabels={{ pin1: ["A"] }}
    footprint={
      <footprint>
        <smtpad shape="rect" width="2mm" height="2mm" pcbX="0mm" pcbY="0mm" portHints={["pin1"]} />
      </footprint>
    }
    {...extra}
  />
)

test("snaps a component to the nearest edge (right edge wins on a wide board)", async () => {
  // 40 x 20 board with hint at (+10, 0). Distances: distLeft=30,
  // distRight=10, distTop=10, distBottom=10. Right ties with top
  // and bottom but the implementation orders left/right before
  // top/bottom, so right wins (deterministic tiebreaker).
  // Body width = 2 mm; right edge at +20 mm; expected center.x = +19.
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="40mm" height="20mm">{probeChip("J_RIGHT", { pcbX: 10, pcbY: 0 })}</board>,
  )
  circuit.render()
  const placed = circuit.db.pcb_component.list()[0]
  expect(placed!.center.x).toBeCloseTo(19, 1)
  // Y unchanged (top/bottom were tied, right won).
  expect(placed!.center.y).toBeCloseTo(0, 1)
})

test("hint near left edge snaps left, Y preserved", async () => {
  // 40 x 20 board, hint at (-15, 4). Distances: distLeft=5,
  // distRight=35, distTop=6, distBottom=14. Left wins.
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="40mm" height="20mm">{probeChip("J_LEFT", { pcbX: -15, pcbY: 4 })}</board>,
  )
  circuit.render()
  const placed = circuit.db.pcb_component.list()[0]
  expect(placed!.center.x).toBeCloseTo(-19, 1) // -20 + 1 (half body)
  expect(placed!.center.y).toBeCloseTo(4, 1) // unchanged
})

test("hint near top edge snaps top, X preserved", async () => {
  // 40 x 20 board, hint at (0, 8). Distances: distLeft=20,
  // distRight=20, distTop=2, distBottom=18. Top wins.
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="40mm" height="20mm">{probeChip("J_TOP", { pcbX: 0, pcbY: 8 })}</board>,
  )
  circuit.render()
  const placed = circuit.db.pcb_component.list()[0]
  expect(placed!.center.x).toBeCloseTo(0, 1) // unchanged
  expect(placed!.center.y).toBeCloseTo(9, 1) // 10 - 1 (half body)
})

test("hint near bottom edge snaps bottom", async () => {
  // 40 x 20 board, hint at (0, -8). Distances: distLeft=20,
  // distRight=20, distTop=18, distBottom=2. Bottom wins.
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="40mm" height="20mm">{probeChip("J_BOTTOM", { pcbX: 0, pcbY: -8 })}</board>,
  )
  circuit.render()
  const placed = circuit.db.pcb_component.list()[0]
  expect(placed!.center.x).toBeCloseTo(0, 1)
  expect(placed!.center.y).toBeCloseTo(-9, 1) // -10 + 1 (half body)
})

test("siblings without shouldBeOnEdgeOfBoard are NOT snapped", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="40mm" height="20mm">
      {probeChip("J_EDGE", { pcbX: 0, pcbY: 8 })}
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
    </board>,
  )
  circuit.render()

  const r1 = circuit.db.pcb_component
    .list()
    .find(
      (c) =>
        circuit.db.source_component.get(c.source_component_id)?.name === "R1",
    )
  expect(r1).toBeDefined()
  // R1 explicitly placed at (5, 0). Edge snap should leave it alone
  // because the prop wasn't set on R1.
  expect(r1!.center.x).toBeCloseTo(5, 1)
  expect(r1!.center.y).toBeCloseTo(0, 1)
})
