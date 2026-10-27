import { expect, test } from "bun:test"
import type { FootprintProp } from "@tscircuit/props"
import { pcb_silkscreen_oval, pcb_silkscreen_pill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Circuit JSON footprints preserve oval and pill dimensions, layers and local rotations", async () => {
  const { circuit } = getTestFixture()
  const footprint = [
    pcb_silkscreen_oval.parse({
      type: "pcb_silkscreen_oval",
      pcb_component_id: "original",
      center: { x: -4, y: 0 },
      radius_x: 3,
      radius_y: 1,
      layer: "top",
      ccw_rotation: 25,
    }),
    pcb_silkscreen_pill.parse({
      type: "pcb_silkscreen_pill",
      pcb_component_id: "original",
      center: { x: 4, y: 0 },
      width: 6,
      height: 2,
      layer: "bottom",
      ccw_rotation: -35,
    }),
  ]
  const original = structuredClone(footprint)
  // FootprintProp still uses the legacy soup union; records above are validated
  // by the current Circuit JSON schemas before crossing this import boundary.
  circuit.add(
    <board width={25} height={20} routingDisabled schematicDisabled>
      <chip
        name="U1"
        pcbRotation={90}
        footprint={footprint as unknown as FootprintProp}
      />
      <pcbnotetext
        text="Imported oval + pill; parent 90deg"
        pcbY={8}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_silkscreen_oval.list()).toHaveLength(1)
  expect(circuit.db.pcb_silkscreen_pill.list()).toHaveLength(1)
  const [oval] = circuit.db.pcb_silkscreen_oval.list()
  const [pill] = circuit.db.pcb_silkscreen_pill.list()
  expect(oval).toMatchObject({ radius_x: 3, radius_y: 1, layer: "top" })
  expect(pill).toMatchObject({ width: 6, height: 2, layer: "bottom" })
  expect(oval.center.x).toBeCloseTo(0, 6)
  expect(oval.center.y).toBeCloseTo(-4, 6)
  expect(pill.center.x).toBeCloseTo(0, 6)
  expect(pill.center.y).toBeCloseTo(4, 6)
  expect(oval.ccw_rotation).toBeCloseTo(115, 6)
  expect(pill.ccw_rotation).toBeCloseTo(55, 6)
  expect(footprint).toEqual(original)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
