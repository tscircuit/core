import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { applyEditEventsToManualEditsFile } from "lib/utils/edit-events/apply-edit-events-to-manual-edits-file"
import type { ManualEditEvent } from "@tscircuit/props"

test("applyEditEventsToManualEditsFile handles schematic edit events", async () => {
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

  // Create edit event to move R1 in schematic
  const schematicEditEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      schematic_component_id:
        circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
    },
  ]

  // Apply the schematic edit events
  const updatedFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: schematicEditEvents,
    manualEditsFile,
  })

  // Verify the schematic placement was added
  expect(updatedFile.schematic_placements).toHaveLength(1)
  expect(updatedFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  })
  // PCB placements should remain empty
  expect(updatedFile.pcb_placements).toHaveLength(0)
})

test("applyEditEventsToManualEditsFile handles PCB edit events", async () => {
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

  // Create edit event to move R1 in PCB
  const pcbEditEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
      original_center: { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
      pcb_edit_event_type: "edit_component_location",
    },
  ]

  // Apply the PCB edit events
  const updatedFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: pcbEditEvents,
    manualEditsFile,
  })

  // Verify the PCB placement was added
  expect(updatedFile.pcb_placements).toHaveLength(1)
  expect(updatedFile.pcb_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  })
  // Schematic placements should remain empty as we only edited PCB
  expect(updatedFile.schematic_placements).toEqual([])
})

test("applyEditEventsToManualEditsFile handles mixed edit events", async () => {
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

  // Create mixed edit events (schematic first, then PCB)
  const schematicEditEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      schematic_component_id:
        circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
    },
  ]

  // Apply the schematic edit events
  const updatedFileWithSchematic = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: schematicEditEvents,
    manualEditsFile,
  })

  // Verify the schematic placement was added
  expect(updatedFileWithSchematic.schematic_placements).toHaveLength(1)
  expect(updatedFileWithSchematic.pcb_placements).toHaveLength(0)

  // Now add PCB edit events
  const pcbEditEvents: ManualEditEvent[] = [
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

  // Apply the PCB edit events
  const finalFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: pcbEditEvents,
    manualEditsFile: updatedFileWithSchematic,
  })

  // Verify both placements exist
  expect(finalFile.schematic_placements).toHaveLength(1)
  expect(finalFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  })
  
  expect(finalFile.pcb_placements).toHaveLength(1)
  expect(finalFile.pcb_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 8, y: 4 },
    relative_to: "group_center",
  })
})