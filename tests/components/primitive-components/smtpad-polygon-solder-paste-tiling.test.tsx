import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/core/pull/2895 (closed unmerged)
// The polygon and pill branches of SmtPad.doInitialPcbPrimitiveRender
// inserted the pad and fell through without any pcb_solder_paste, so
// these pads went to fabrication with no stencil aperture.

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

const polygonArea = (polygon: Array<{ x: number; y: number }>) => {
  let area = 0
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!
    const pj = polygon[j]!
    area += pj.x * pi.y - pi.x * pj.y
  }
  return Math.abs(area) / 2
}

test("polygon smtpad emits rect solder paste tiling the pad exactly", async () => {
  const { circuit } = getTestFixture()

  // L-shaped land: 2mm x 2mm square with the top-right 1mm x 1mm removed
  const lShape = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ]

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad shape="polygon" points={lShape} portHints={["1"]} />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pad = circuit.db.pcb_smtpad.list()[0]!
  expect(pad.shape).toBe("polygon")
  const pastes = circuit.db.pcb_solder_paste.list()
  expect(pastes.length).toBeGreaterThan(0)

  const padPoints = (pad as any).points as Array<{ x: number; y: number }>
  let pasteArea = 0
  for (const paste of pastes) {
    expect(paste.shape).toBe("rect")
    expect(paste.pcb_smtpad_id).toBe(pad.pcb_smtpad_id)
    const p = paste as any
    pasteArea += p.width * p.height
    // every corner, pulled fractionally inward, lies inside the pad
    for (const [sx, sy] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      expect(
        pointInPolygon(
          {
            x: p.x + sx! * p.width * 0.4999 - sx! * 1e-6,
            y: p.y + sy! * p.height * 0.4999 - sy! * 1e-6,
          },
          padPoints,
        ),
      ).toBe(true)
    }
  }
  expect(pasteArea).toBeCloseTo(polygonArea(padPoints), 6)

  // the removed notch quadrant carries no aperture
  const bounds = {
    minX: Math.min(...padPoints.map((p) => p.x)),
    maxX: Math.max(...padPoints.map((p) => p.x)),
    minY: Math.min(...padPoints.map((p) => p.y)),
    maxY: Math.max(...padPoints.map((p) => p.y)),
  }
  const notchProbe = {
    x: bounds.minX + (bounds.maxX - bounds.minX) * 0.75,
    y: bounds.minY + (bounds.maxY - bounds.minY) * 0.75,
  }
  for (const paste of pastes) {
    const p = paste as any
    const insideX = Math.abs(notchProbe.x - p.x) < p.width / 2
    const insideY = Math.abs(notchProbe.y - p.y) < p.height / 2
    expect(insideX && insideY).toBe(false)
  }
})
