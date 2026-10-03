import { expect, test } from "bun:test"
import { assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("all six shaft directions orient the actual motor mesh", async () => {
  // Expected world bounds from a 38 mm body plus 3 mm rear screw heads, and 24 mm
  // shaft ahead. The exporter maps world points (x,y,z) to scene (-x,z,y):
  // circuit-to-3d followed by GLTFBuilder.convertMeshToGLTFOrientation.
  const panels = []
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
    expect(bounds.min[sceneAxis]).toBeCloseTo(sign === 1 ? -41 : -24, 2)
    expect(bounds.max[sceneAxis]).toBeCloseTo(sign === 1 ? 24 : 41, 2)
    // Annotate the measured shaft tip in the exporter's scene frame (-x,z,y), mm.
    const shaftTip = [0, 0, 0]
    shaftTip[sceneAxis] = sign * 28
    panels.push({
      title: `shaftFacingDirection="${direction}"`,
      code: `<assembly.device>
  <assembly.motor
    name="NEMA17"
    standard="nema17"
    shaftFacingDirection="${direction}"
  />
</assembly.device>`,
      annotation: `Shaft points ${direction}; body 38 mm + 3 mm rear heads; shaft 24 mm. Same camera in every view.`,
      circuit,
      renderOptions: {
        camPos: [-85, 75, 85] as [number, number, number],
        poppygl: {
          debugFontSize: 18,
          debugPoints: [
            {
              label: `shaft ${direction}`,
              position: { x: shaftTip[0]!, y: shaftTip[1]!, z: shaftTip[2]! },
            },
          ],
        },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA17: all six shaft directions",
    columns: 2,
    panels,
  })
})
