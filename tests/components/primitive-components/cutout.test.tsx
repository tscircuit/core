import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type {
  PcbCutout,
  PcbCutoutCircle,
  PcbCutoutPolygon,
  PcbCutoutRect,
} from "circuit-json"

test("Cutout component rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <cutout shape="rect" width="5mm" height="3mm" pcbX="-10mm" pcbY="0mm" />
      <cutout shape="circle" radius="2mm" pcbX="0mm" pcbY="0mm" />
      <cutout
        shape="polygon"
        points={[
          { x: 5, y: -2 },
          { x: 8, y: 0 },
          { x: 5, y: 2 },
          { x: 6, y: 0 },
        ]}
        pcbX="5mm"
        pcbY="0mm"
      />
    </board>,
  )

  circuit.render()

  const pcbCutouts = circuit.db.pcb_cutout.list() as PcbCutout[]

  expect(pcbCutouts.length).toBe(3)

  const rectCutout = pcbCutouts.find((c) => c.shape === "rect") as
    | PcbCutoutRect
    | undefined
  expect(rectCutout).toBeDefined()
  expect(rectCutout?.width).toBe(5)
  expect(rectCutout?.height).toBe(3)
  expect(rectCutout?.center.x).toBe(-10)

  const circleCutout = pcbCutouts.find((c) => c.shape === "circle") as
    | PcbCutoutCircle
    | undefined
  expect(circleCutout).toBeDefined()
  expect(circleCutout?.radius).toBe(2)
  expect(circleCutout?.center.x).toBe(0)

  const polygonCutout = pcbCutouts.find((c) => c.shape === "polygon") as
    | PcbCutoutPolygon
    | undefined
  expect(polygonCutout).toBeDefined()
  expect(polygonCutout?.points.length).toBe(4)
  expect(polygonCutout?.points[0].x).toBe(10)
  expect(polygonCutout?.points[0].y).toBe(-2)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
