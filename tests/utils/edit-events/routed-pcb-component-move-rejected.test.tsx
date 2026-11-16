import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { applyPcbMoveWithRouting } from "lib/utils/edit-events/apply-pcb-move-with-routing"

test("a moved pad crossing another route is rejected", async () => {
  const circuit = new RootCircuit()
  circuit.add(
    <board width={16} height={10}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-4}
        pcbY={-3}
      />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={4} pcbY={-3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <trace from=".R3 > .pin2" to=".R4 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const resistor = circuit.db.source_component.getWhere({ name: "R2" })!
  const component = circuit.db.pcb_component.getWhere({
    source_component_id: resistor.source_component_id,
  })!
  const original = circuit.getCircuitJson()
  const untouched = structuredClone(original)
  const edited = await applyPcbMoveWithRouting({
    circuitJson: original,
    editEvent: {
      edit_event_id: "move_r2",
      edit_event_type: "edit_pcb_component_location",
      pcb_edit_event_type: "edit_component_location",
      created_at: 0,
      pcb_component_id: component.pcb_component_id,
      original_center: component.center,
      new_center: { x: 0, y: -3 },
    },
  })

  expect(edited).toBeNull()
  expect(original).toEqual(untouched)
})
