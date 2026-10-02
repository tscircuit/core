import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("all six shaft directions orient the actual motor mesh", async () => {
  // Expected world bounds from a 38 mm body behind the origin and 24 mm
  // shaft ahead. The exporter maps world points (x,y,z) to scene (-x,z,y):
  // circuit-to-3d followed by GLTFBuilder.convertMeshToGLTFOrientation.
  for (const [direction, sceneAxis, sign] of [
    ["x+", 0, -1],
    ["x-", 0, 1],
    ["y+", 2, 1],
    ["y-", 2, -1],
    ["z+", 1, 1],
    ["z-", 1, -1],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor
          name="NEMA17"
          standard="nema17"
          shaftFacingDirection={direction}
        />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const bounds = await getRenderedMotorBounds(circuit.getCircuitJson())
    expect(bounds.min[sceneAxis]).toBeCloseTo(sign === 1 ? -38 : -24, 2)
    expect(bounds.max[sceneAxis]).toBeCloseTo(sign === 1 ? 24 : 38, 2)
    await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
      snapshotSuffix: direction
        .replace("+", "-positive")
        .replace(/-$/, "-negative"),
      camPos: [95, 95, 95],
      poppygl: { grid: false, backgroundColor: [1, 1, 1] },
    })
  }
})
