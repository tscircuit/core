import type { ManualEditEvent } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { applyEditEventsToManualEditsFile } from "lib/utils/edit-events/apply-edit-events-to-manual-edits-file"

test("applyEditEventsToManualEditsFile handles both schematic and PCB edit events", async () => {
  // Create a circuit with a resistor
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" />
    </board>,
  )
  await circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Initial manual edits file
  const manualEditsFile = {
    schematic_placements: [],
    pcb_placements: [],
  }

  // Create a mixed array of edit events (both schematic and PCB)
  const mixedEditEvents: ManualEditEvent[] = [
    // Schematic edit event
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      schematic_component_id:
        circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
    },
    // PCB edit event
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_2",
      created_at: Date.now(),
      pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
      original_center: { x: 0, y: 0 },
      new_center: { x: 8, y: 4 },
      pcb_edit_event_type: "edit_component_location",
    },
  ]

  // Apply the mixed edit events in a single call
  const updatedFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: mixedEditEvents,
    manualEditsFile,
  })

  // Verify both schematic and PCB placements were correctly updated
  expect(updatedFile.schematic_placements).toHaveLength(1)
  expect(updatedFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  })

  expect(updatedFile.pcb_placements).toHaveLength(1)
  expect(updatedFile.pcb_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 8, y: 4 },
    relative_to: "group_center",
  })
})

test("applyEditEventsToManualEditsFile updates existing placements", async () => {
  // Create a circuit with a resistor
  const circuit = new RootCircuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" />
    </board>,
  )
  await circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Initial manual edits file with existing placements
  const manualEditsFile = {
    schematic_placements: [
      {
        selector: "R1",
        center: { x: 2, y: 2 },
        relative_to: "group_center",
      },
    ],
    pcb_placements: [
      {
        selector: "R1",
        center: { x: 3, y: 3 },
        relative_to: "group_center",
      },
    ],
  }

  // Create edit events to update existing placements
  const updateEditEvents: ManualEditEvent[] = [
    // Update schematic placement
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_3",
      created_at: Date.now(),
      schematic_component_id:
        circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: { x: 2, y: 2 },
      new_center: { x: 10, y: 10 },
    },
    // Update PCB placement
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_4",
      created_at: Date.now(),
      pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
      original_center: { x: 3, y: 3 },
      new_center: { x: 12, y: 12 },
      pcb_edit_event_type: "edit_component_location",
    },
  ]

  // Apply the update edit events
  const updatedFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: updateEditEvents,
    manualEditsFile,
  })

  // Verify placements were updated, not added
  expect(updatedFile.schematic_placements).toHaveLength(1)
  expect(updatedFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 10, y: 10 },
    relative_to: "group_center",
  })

  expect(updatedFile.pcb_placements).toHaveLength(1)
  expect(updatedFile.pcb_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 12, y: 12 },
    relative_to: "group_center",
  })
})
