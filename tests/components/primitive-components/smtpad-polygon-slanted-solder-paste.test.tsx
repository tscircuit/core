import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pointInPolygon = (
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>,
) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!
    const pj = polygon[j]!
    if (
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x
    ) {
      inside = !inside
    }
  }
  return inside
}

test("polygon smtpad with slanted edges emits only contained paste", async () => {
  const { circuit } = getTestFixture()

  // house pentagon: square base with triangular roof
  const house = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1.5 },
    { x: -1, y: 0.5 },
  ]

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad shape="polygon" points={house} portHints={["1"]} />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pad = circuit.db.pcb_smtpad.list()[0]! as any
  const pastes = circuit.db.pcb_solder_paste.list()
  expect(pastes.length).toBeGreaterThan(0)
  for (const paste of pastes) {
    const p = paste as any
    for (const [sx, sy] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      expect(
        pointInPolygon(
          {
            x: p.x + sx! * (p.width / 2 - 1e-9),
            y: p.y + sy! * (p.height / 2 - 1e-9),
          },
          pad.points,
        ),
      ).toBe(true)
    }
  }
})
