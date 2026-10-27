import { expect, test } from "bun:test"
import { pcb_silkscreen_oval, pcb_silkscreen_pill } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen oval and pill JSX emit their native Circuit JSON records", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={12} routingDisabled schematicDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <silkscreenoval radiusX="3mm" radiusY="1mm" pcbX={-4} />
            <silkscreenpill width="6mm" height="2mm" pcbX={4} />
          </footprint>
        }
      />
      <pcbnotetext
        text="oval 6 x 2 mm | pill 6 x 2 mm"
        pcbY={4}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const [oval] = circuit.db.pcb_silkscreen_oval.list()
  const [pill] = circuit.db.pcb_silkscreen_pill.list()
  expect(pcb_silkscreen_oval.parse(oval)).toMatchObject({
    radius_x: 3,
    radius_y: 1,
    center: { x: -4, y: 0 },
    layer: "top",
    ccw_rotation: 0,
  })
  expect(pcb_silkscreen_pill.parse(pill)).toMatchObject({
    width: 6,
    height: 2,
    center: { x: 4, y: 0 },
    layer: "top",
    ccw_rotation: 0,
  })
  const component = circuit.db.pcb_component.list()[0]
  for (const shape of [oval, pill]) {
    expect(shape.pcb_component_id).toBe(component.pcb_component_id)
    expect(shape.pcb_group_id).toBe(component.pcb_group_id)
    expect(shape.subcircuit_id).toBe(component.subcircuit_id)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
