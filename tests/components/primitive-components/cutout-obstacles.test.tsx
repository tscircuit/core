import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getSvgFromGraphicsObject } from "graphics-debug"

test("Cutout obstacles generation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <cutout shape="rect" width="5mm" height="3mm" pcbX="-10mm" pcbY="0mm" />
      <cutout shape="circle" radius="2mm" pcbX="0mm" pcbY="0mm" />
      <cutout
        shape="polygon"
        points={[
          { x: 0, y: -5 },
          { x: 1, y: -2 },
          { x: 4, y: -2 },
          { x: 2, y: 0 },
          { x: 3, y: 3 },
          { x: 0, y: 1 },
          { x: -3, y: 3 },
          { x: -2, y: 0 },
          { x: -4, y: -2 },
          { x: -1, y: -2 },
        ]}
        pcbX="10mm"
        pcbY="0mm"
      />
    </board>,
  )

  circuit.render()

  const obstacles = getObstaclesFromCircuitJson(circuit.getCircuitJson())

  expect(
    getSvgFromGraphicsObject({
      rects: obstacles,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
