import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon smtpad paste follows the pad through grid layout", async () => {
  const { circuit } = getTestFixture()

  const land = [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
    { x: -0.5, y: 0.5 },
  ]
  const polyChip = (name: string) => (
    <chip
      name={name}
      footprint={
        <footprint>
          <smtpad shape="polygon" points={land} portHints={["1"]} />
        </footprint>
      }
    />
  )

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <group pcbGrid pcbGridCols={2} pcbGridGap="8mm">
        {polyChip("U1")}
        {polyChip("U2")}
        {polyChip("U3")}
        {polyChip("U4")}
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  const pastes = circuit.db.pcb_solder_paste.list()
  expect(pads.length).toBe(4)
  expect(pastes.length).toBe(4)

  const padCenters = new Set(
    pads.map((pad) => {
      const points = (pad as any).points as Array<{ x: number; y: number }>
      const cx =
        (Math.min(...points.map((p) => p.x)) +
          Math.max(...points.map((p) => p.x))) /
        2
      const cy =
        (Math.min(...points.map((p) => p.y)) +
          Math.max(...points.map((p) => p.y))) /
        2
      return `${cx.toFixed(3)},${cy.toFixed(3)}`
    }),
  )
  expect(padCenters.size).toBe(4)

  for (const paste of pastes) {
    const pad = circuit.db.pcb_smtpad.get(paste.pcb_smtpad_id!)! as any
    const points = pad.points as Array<{ x: number; y: number }>
    const cx =
      (Math.min(...points.map((p) => p.x)) +
        Math.max(...points.map((p) => p.x))) /
      2
    const cy =
      (Math.min(...points.map((p) => p.y)) +
        Math.max(...points.map((p) => p.y))) /
      2
    expect((paste as any).x).toBeCloseTo(cx, 6)
    expect((paste as any).y).toBeCloseTo(cy, 6)
  }
})
