import { expect, test } from "bun:test"
import type { BRepShape, Point } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const isPointInPolygon = (point: Point, vertices: Point[]): boolean => {
  let isInside = false
  for (
    let i = 0, prev = vertices.length - 1;
    i < vertices.length;
    prev = i++
  ) {
    const curr = vertices[i]!
    const prevPt = vertices[prev]!
    if (
      curr.y > point.y !== prevPt.y > point.y &&
      point.x <
        ((prevPt.x - curr.x) * (point.y - curr.y)) / (prevPt.y - curr.y) +
          curr.x
    ) {
      isInside = !isInside
    }
  }
  return isInside
}

const isPointInBrepShape = (point: Point, brepShape: BRepShape): boolean =>
  isPointInPolygon(point, brepShape.outer_ring.vertices) &&
  !brepShape.inner_rings.some((ring) => isPointInPolygon(point, ring.vertices))

test("two full-board same-layer copper pours on different nets partition the layer without overlapping", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <net name="GND" />
      <net name="VCC" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin1" to="net.GND" />
      <trace from=".R1 > .pin2" to="net.VCC" />
      <trace from=".R2 > .pin1" to="net.GND" />
      <trace from=".R2 > .pin2" to="net.VCC" />
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.VCC" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceNets = circuit.db.source_net.list()
  const gndNet = sourceNets.find((n) => n.name === "GND")!
  const vccNet = sourceNets.find((n) => n.name === "VCC")!

  const pours = circuit.db.pcb_copper_pour.list()
  const gndPours = pours.filter((p) => p.source_net_id === gndNet.source_net_id)
  const vccPours = pours.filter((p) => p.source_net_id === vccNet.source_net_id)

  expect(gndPours.length).toBeGreaterThan(0)
  expect(vccPours.length).toBeGreaterThan(0)

  const pads = circuit.db.pcb_smtpad.list()
  for (const pad of pads) {
    if (pad.shape !== "rect") continue
    const padPoint = { x: pad.x, y: pad.y }
    const inGndPour = gndPours.some(
      (p) => p.shape === "brep" && isPointInBrepShape(padPoint, p.brep_shape),
    )
    const inVccPour = vccPours.some(
      (p) => p.shape === "brep" && isPointInBrepShape(padPoint, p.brep_shape),
    )
    expect(inGndPour && inVccPour).toBe(false)
  }

  // Sample a grid across the board to ensure no point is inside both GND and VCC pours
  for (let x = -4.5; x <= 4.5; x += 0.5) {
    for (let y = -4.5; y <= 4.5; y += 0.5) {
      const pt = { x, y }
      const inGnd = gndPours.some(
        (p) => p.shape === "brep" && isPointInBrepShape(pt, p.brep_shape),
      )
      const inVcc = vccPours.some(
        (p) => p.shape === "brep" && isPointInBrepShape(pt, p.brep_shape),
      )
      expect(inGnd && inVcc).toBe(false)
    }
  }
})

test("explicit-outline pour declared before full-board pour on same layer is not swallowed", async () => {
  const { circuit } = getTestFixture()

  const insetOutline = [
    { x: -2, y: -2 },
    { x: 2, y: -2 },
    { x: 2, y: 2 },
    { x: -2, y: 2 },
  ]

  circuit.add(
    <board width="12mm" height="12mm" routingDisabled>
      <net name="GND" />
      <net name="VCC" />
      <copperpour connectsTo="net.VCC" layer="top" outline={insetOutline} />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceNets = circuit.db.source_net.list()
  const gndNet = sourceNets.find((n) => n.name === "GND")!
  const vccNet = sourceNets.find((n) => n.name === "VCC")!

  const pours = circuit.db.pcb_copper_pour.list()
  const gndPours = pours.filter((p) => p.source_net_id === gndNet.source_net_id)
  const vccPours = pours.filter((p) => p.source_net_id === vccNet.source_net_id)

  expect(gndPours).toHaveLength(1)
  expect(vccPours).toHaveLength(1)

  const gndShape =
    gndPours[0]!.shape === "brep" ? gndPours[0]!.brep_shape : undefined
  const vccShape =
    vccPours[0]!.shape === "brep" ? vccPours[0]!.brep_shape : undefined
  expect(gndShape).toBeDefined()
  expect(vccShape).toBeDefined()

  // Center (0, 0) belongs exclusively to the inset VCC pour
  expect(isPointInBrepShape({ x: 0, y: 0 }, vccShape!)).toBe(true)
  expect(isPointInBrepShape({ x: 0, y: 0 }, gndShape!)).toBe(false)

  // Outer region (4, 0) belongs exclusively to the full-board GND pour
  expect(isPointInBrepShape({ x: 4, y: 0 }, gndShape!)).toBe(true)
  expect(isPointInBrepShape({ x: 4, y: 0 }, vccShape!)).toBe(false)
})
