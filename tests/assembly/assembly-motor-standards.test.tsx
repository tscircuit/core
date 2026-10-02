import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("NEMA standards use modelprinter geometry without electrical footprints", async () => {
  for (const [standard, width, length, shaftLength] of [
    ["nema8", 20.3, 33, 15],
    ["nema17", 42.3, 38, 24],
    ["nema23", 56.4, 51, 20.6],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor name={standard} standard={standard} />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.cad_component.list()[0]).toMatchObject({
      model_glb_url: `https://modelcdn.tscircuit.com/jscad_models/${standard}.glb`,
      position: { x: 0, y: 0, z: 0 },
      model_origin_position: { x: 0, y: 0, z: 0 },
    })
    expect(circuit.db.pcb_component.list()).toHaveLength(0)
    expect(circuit.db.schematic_component.list()).toHaveLength(0)
    const bounds = await getRenderedMotorBounds(circuit.getCircuitJson())
    expect(bounds.max[0]! - bounds.min[0]!).toBeCloseTo(width, 2)
    expect(bounds.min[1]).toBeCloseTo(-length, 2)
    expect(bounds.max[1]).toBeCloseTo(shaftLength, 2)
    await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
      snapshotSuffix: standard,
      camPos: [100, 80, 100],
      poppygl: { lookAt: [0, -10, 0], grid: false, backgroundColor: [1, 1, 1] },
    })
  }
})
