import { expect, test } from "bun:test"
import type { PcbCutoutRect } from "circuit-json"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const footprint = (
  <footprint>
    <cutout shape="rect" width="4mm" height="1mm" pcbX="0mm" pcbY="0mm" />
    <smtpad
      portHints={["1"]}
      shape="rect"
      width="1mm"
      height="1mm"
      pcbX="0mm"
      pcbY="2mm"
    />
  </footprint>
)

test("rect cutout keeps a 45 degree footprint rotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm">
      <chip name="U1" pcbRotation={45} footprint={footprint} />
    </board>,
  )

  circuit.render()

  const cutout = circuit.db.pcb_cutout.list()[0] as PcbCutoutRect
  expect(cutout.shape).toBe("rect")
  expect(cutout.width).toBeCloseTo(4)
  expect(cutout.height).toBeCloseTo(1)
  expect(cutout.rotation).toBeCloseTo(45)

  const cutoutObstacle = getObstaclesFromCircuitJson(
    circuit.getCircuitJson(),
  ).find((obstacle) => obstacle.connectedTo.length === 0)
  expect(cutoutObstacle).toMatchObject({
    width: 4,
    height: 1,
    ccwRotationDegrees: cutout.rotation,
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("rect cutout swaps its size when the parent group is rotated 90 degrees", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="12mm">
      <group pcbRotation={90}>
        <chip name="U1" footprint={footprint} />
      </group>
    </board>,
  )

  circuit.render()

  const cutout = circuit.db.pcb_cutout.list()[0] as PcbCutoutRect
  expect(cutout.width).toBeCloseTo(1)
  expect(cutout.height).toBeCloseTo(4)
  expect(cutout.rotation).toBeUndefined()
})
