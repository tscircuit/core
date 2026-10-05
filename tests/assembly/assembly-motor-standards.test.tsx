import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expect, test } from "bun:test"
import { assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getRenderedMotorBounds } from "./fixtures/get-rendered-motor-bounds"

test("NEMA standards use modelprinter geometry without electrical footprints", async () => {
  const panels = []
  for (const [standard, width, length, shaftLength, headHeight] of [
    ["nema8", 20.3, 33, 15, 2],
    ["nema17", 42.3, 38, 24, 3],
    ["nema23", 56.4, 51, 20.6, 4],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.motor name={standard} standard={standard} />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const json = await withLocalNemaMesh(circuit.getCircuitJson())
    expect(circuit.db.cad_component.list()[0]).toMatchObject({
      model_glb_url: `https://modelcdn.tscircuit.com/jscad_models/${standard}.glb`,
      position: { x: 0, y: 0, z: 0 },
      model_origin_position: { x: 0, y: 0, z: 0 },
    })
    expect(circuit.db.pcb_component.list()).toHaveLength(0)
    expect(circuit.db.schematic_component.list()).toHaveLength(0)
    const bounds = await getRenderedMotorBounds(json)
    expect(bounds.max[2]! - bounds.min[2]!).toBeCloseTo(width, 2)
    expect(bounds.max[0]).toBeCloseTo(width / 2, 2)
    expect(bounds.min[0]).toBeCloseTo(-width / 2 - 6, 2)
    expect(bounds.min[1]).toBeCloseTo(-length - headHeight, 2)
    expect(bounds.max[1]).toBeCloseTo(shaftLength, 2)
    panels.push({
      title: standard.toUpperCase(),
      code: `<assembly.device>
  <assembly.motor
    name="${standard}"
    standard="${standard}"
  />
</assembly.device>`,
      annotation: `${width} mm frame / ${length} mm body / ${shaftLength} mm shaft / 6 mm wires / ${headHeight} mm rear heads`,
      circuit: json,
      renderOptions: {
        camPos: [80, 65, 80] as [number, number, number],
        poppygl: { lookAt: [0, -10, 0] as [number, number, number] },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "NEMA standards: NEMA8, NEMA17, NEMA23",
    panels,
  })
})
