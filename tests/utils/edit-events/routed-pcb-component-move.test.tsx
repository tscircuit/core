import { expect, test } from "bun:test"
import type { ManualEditEvent } from "@tscircuit/props"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { RootCircuit } from "lib/RootCircuit"
import { applyPcbMoveWithRouting } from "lib/utils/edit-events/apply-pcb-move-with-routing"
import "../../fixtures/extend-expect-circuit-snapshot"

test("moving a PCB component repairs its trace end and preserves other copper", async () => {
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
  const editEvent = {
    edit_event_id: "move_r2",
    edit_event_type: "edit_pcb_component_location",
    pcb_edit_event_type: "edit_component_location",
    created_at: 0,
    pcb_component_id: component.pcb_component_id,
    original_center: component.center,
    new_center: { ...component.center, y: component.center.y + 1 },
  } satisfies ManualEditEvent
  const original = circuit.getCircuitJson()
  const edited = await applyPcbMoveWithRouting({
    circuitJson: original,
    editEvent,
  })

  expect(edited).not.toBeNull()
  const originalTraces = original.filter(
    (element) => element.type === "pcb_trace",
  )
  const editedTraces = edited!.filter((element) => element.type === "pcb_trace")
  expect(editedTraces).toHaveLength(2)
  const movedPorts = circuit.db.pcb_port
    .list()
    .filter((port) => port.pcb_component_id === component.pcb_component_id)
  const repairedTrace = editedTraces.find((trace) => {
    const end = trace.route.at(-1)
    return (
      end?.route_type === "wire" &&
      movedPorts.some((port) => port.pcb_port_id === end.end_pcb_port_id)
    )
  })!
  expect(repairedTrace.route.at(-1)).toMatchObject({
    route_type: "wire",
    y: editEvent.new_center.y,
  })
  const untouchedTrace = originalTraces.find(
    (trace) => trace.pcb_trace_id !== repairedTrace.pcb_trace_id,
  )!
  expect(editedTraces).toContainEqual(untouchedTrace)
  expect(await runAllRoutingChecks(edited!)).toEqual([])
  await expect(edited).toMatchPcbSnapshot(import.meta.path)
})
