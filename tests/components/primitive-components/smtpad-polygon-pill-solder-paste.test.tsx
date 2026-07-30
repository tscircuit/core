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

test("mask-covered polygon smtpad emits no solder paste", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="polygon"
              points={[
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 },
              ]}
              coveredWithSolderMask
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_smtpad.list().length).toBe(1)
  expect(circuit.db.pcb_solder_paste.list().length).toBe(0)
})

test("pill smtpad emits a 0.7-scaled pill solder paste", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width="1mm"
              height="0.6mm"
              radius="0.3mm"
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pad = circuit.db.pcb_smtpad.list()[0]! as any
  const pastes = circuit.db.pcb_solder_paste.list()
  expect(pastes.length).toBe(1)
  const paste = pastes[0]! as any
  expect(paste.shape).toBe("pill")
  expect(paste.width).toBeCloseTo(0.7, 6)
  expect(paste.height).toBeCloseTo(0.42, 6)
  expect(paste.radius).toBeCloseTo(0.21, 6)
  expect(paste.x).toBeCloseTo(pad.x, 6)
  expect(paste.y).toBeCloseTo(pad.y, 6)
  expect(paste.pcb_smtpad_id).toBe(pad.pcb_smtpad_id)
})

test("rotated pill smtpad emits a contained rotated_rect solder paste", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        pcbRotation={30}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width="1mm"
              height="0.6mm"
              radius="0.3mm"
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pad = circuit.db.pcb_smtpad.list()[0]! as any
  expect(pad.shape).toBe("rotated_pill")
  const pastes = circuit.db.pcb_solder_paste.list()
  expect(pastes.length).toBe(1)
  const paste = pastes[0]! as any
  expect(paste.shape).toBe("rotated_rect")
  expect(paste.width).toBeCloseTo(0.7, 6)
  expect(paste.height).toBeCloseTo(0.42, 6)
  expect(paste.ccw_rotation).toBeCloseTo(pad.ccw_rotation, 6)
  expect(paste.x).toBeCloseTo(pad.x, 6)
  expect(paste.y).toBeCloseTo(pad.y, 6)
})

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
