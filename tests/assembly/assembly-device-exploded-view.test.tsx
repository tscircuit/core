import { expect, test } from "bun:test"
import { cad_component } from "circuit-json"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("components emit normalized exploded-view offsets from flat props", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="MuseAir">
      <group name="Assembly" subcircuit>
        <chip
          name="PCB"
          footprint={<footprint />}
          cadModel={{ jscad: { type: "cuboid", size: [40, 30, 2] } }}
        />
        <chip
          name="ENCLOSURE_BASE"
          footprint={<footprint />}
          cadModel={{ jscad: { type: "cuboid", size: [52, 42, 6] } }}
          explodeDirection="below"
          explodeDistance="6cm"
        />
        <chip
          name="USB_POWER_CABLE"
          footprint={<footprint />}
          cadModel={{ jscad: { type: "cuboid", size: [28, 8, 8] } }}
          explodeDirection={{ x: 1, y: -0.35, z: 0 }}
          explodeDistance={48}
        />
      </group>
    </assembly.device>,
  )

  circuit.render()

  const cadComponentsByName = new Map(
    circuit.db.cad_component.list().map((cadComponent) => {
      const sourceComponent = circuit.db.source_component.get(
        cadComponent.source_component_id,
      )!
      return [sourceComponent.name, cad_component.parse(cadComponent)] as const
    }),
  )

  expect(cadComponentsByName.get("PCB")?.explode_offset).toBeUndefined()
  expect(cadComponentsByName.get("ENCLOSURE_BASE")?.explode_offset).toEqual({
    x: 0,
    y: 0,
    z: -60,
  })
  const cableOffset = cadComponentsByName.get("USB_POWER_CABLE")?.explode_offset
  expect(cableOffset?.x).toBeCloseTo(45.3052)
  expect(cableOffset?.y).toBeCloseTo(-15.8568)
  expect(cableOffset?.z).toBe(0)
  expect(
    Math.hypot(cableOffset!.x, cableOffset!.y, cableOffset!.z),
  ).toBeCloseTo(48)

  const fullyExplodedCircuitJson = circuit.getCircuitJson().map((element) => {
    if (element.type !== "cad_component" || !element.explode_offset) {
      return element
    }
    return {
      ...element,
      position: {
        x: element.position.x + element.explode_offset.x,
        y: element.position.y + element.explode_offset.y,
        z: element.position.z + element.explode_offset.z,
      },
    }
  })
  await expectAssemblySnapshot(import.meta.path, {
    title: "Exploded travel is authored on each assembly part",
    panels: [
      {
        title: "PCB fixed; enclosure and cable move along authored directions",
        code: `<assembly.device name="MuseAir">
  <group subcircuit>
    <chip name="PCB" ... />
    <chip name="ENCLOSURE_BASE"
      explodeDirection="below"
      explodeDistance="6cm" ... />
    <chip name="USB_POWER_CABLE"
      explodeDirection={{ x: 1, y: -0.35, z: 0 }}
      explodeDistance={48} ... />
  </group>
</assembly.device>`,
        annotation:
          "Snapshot applies emitted explode_offset at 100%; assembled positions remain unchanged.",
        circuit: fullyExplodedCircuitJson,
        renderOptions: {
          camPos: [100, -120, 90],
          poppygl: { lookAt: [0, -5, -10] },
        },
      },
    ],
  })
})
