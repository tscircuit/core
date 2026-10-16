import { expect, test } from "bun:test"
import { Circuit } from "lib/index"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { fillCircleWithRects } from "lib/utils/obstacles/fillCircleWithRects"
import { fillPolygonWithRects } from "lib/utils/obstacles/fillPolygonWithRects"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"

test("small polygon and circular cutouts smaller than rectHeight still produce routing obstacles", () => {
  const thinSlotPoints = [
    { x: -1, y: -0.1 },
    { x: 1, y: -0.1 },
    { x: 1, y: 0.1 },
    { x: -1, y: 0.1 },
  ]

  const polygonRects = fillPolygonWithRects(thinSlotPoints, {
    rectHeight: 0.6,
  })
  expect(polygonRects).toHaveLength(1)
  expect(polygonRects[0]?.center).toEqual({ x: 0, y: 0 })
  expect(polygonRects[0]?.width).toBeCloseTo(2)
  expect(polygonRects[0]?.height).toBeCloseTo(0.2)

  const circleRects = fillCircleWithRects(
    { center: { x: 0, y: 1 }, radius: 0.2 },
    { rectHeight: 0.6 },
  )
  expect(circleRects).toHaveLength(1)
  expect(circleRects[0]?.center).toEqual({ x: 0, y: 1 })
  expect(circleRects[0]?.width).toBeCloseTo(0.4)
  expect(circleRects[0]?.height).toBeCloseTo(0.4)

  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <cutout shape="polygon" points={thinSlotPoints} />
      <cutout shape="circle" radius="0.2mm" pcbX={0} pcbY={1} />
    </board>,
  )

  circuit.render()
  const circuitJson = circuit.getCircuitJson()
  const obstacles = getObstaclesFromCircuitJson(circuitJson)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })

  for (const list of [obstacles, simpleRouteJson.obstacles]) {
    expect(
      list.some(
        (o) =>
          o.connectedTo.length === 0 &&
          Math.abs(o.center.x - 0) < 1e-6 &&
          Math.abs(o.center.y - 0) < 1e-6 &&
          Math.abs(o.width - 2) < 1e-6 &&
          Math.abs(o.height - 0.2) < 1e-6,
      ),
    ).toBe(true)

    expect(
      list.some(
        (o) =>
          o.connectedTo.length === 0 &&
          Math.abs(o.center.x - 0) < 1e-6 &&
          Math.abs(o.center.y - 1) < 1e-6 &&
          Math.abs(o.width - 0.4) < 1e-6 &&
          Math.abs(o.height - 0.4) < 1e-6,
      ),
    ).toBe(true)
  }
})
