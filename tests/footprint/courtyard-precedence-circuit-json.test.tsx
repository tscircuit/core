import { expect, test } from "bun:test"
import type { CapacitorProps } from "@tscircuit/props"
import { getCourtyardTestFootprintCircuitJson } from "tests/fixtures/courtyard-test-footprint"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit courtyards replace all shapes from a Circuit JSON footprint", async () => {
  const { circuit } = getTestFixture()
  // FootprintProps currently describe only pads, though core accepts full Circuit JSON.
  const footprint = getCourtyardTestFootprintCircuitJson() as Extract<
    CapacitorProps["footprint"],
    unknown[]
  >
  circuit.add(
    <board width={16} height={9} routingDisabled>
      <capacitor
        name="C0"
        capacitance="100nF"
        footprint={footprint}
        pcbX={-4}
      />
      <capacitor name="C1" capacitance="100nF" footprint={footprint} pcbX={4}>
        <courtyardcircle radius={1} />
      </capacitor>
      <pcbnotetext
        pcbY={3.5}
        text="C0: all defaults   C1: circle override"
        fontSize={0.6}
      />
    </board>,
  )
  circuit.render()

  expect(circuit.db.pcb_courtyard_rect.list()).toHaveLength(1)
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(2)
  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(1)
  const overriddenPartId = circuit.selectOne(".C1")!.pcb_component_id
  expect(
    circuit.db.pcb_courtyard_circle
      .list()
      .filter((circle) => circle.pcb_component_id === overriddenPartId),
  ).toMatchObject([{ radius: 1 }])
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(4)
  expect(
    footprint.filter((elm) => elm.type.startsWith("pcb_courtyard_")),
  ).toHaveLength(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
