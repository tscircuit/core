import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { applyEditEventsToManualEditsFile } from "lib/utils/edit-events/apply-edit-events-to-manual-edits-file"
import type { ManualEditEvent } from "@tscircuit/props"

test("applyEditEventsToManualEditsFile updates component locations", async () => {
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
  }

  // Create edit event to move R1
  const editEvents: ManualEditEvent[] = [
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

  // Apply the edit events
  const updatedFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents,
    manualEditsFile,
  })

  // Verify the placement was added
  expect(updatedFile.schematic_placements).toHaveLength(1)
  expect(updatedFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  })

  // Test updating existing placement
  const secondEditEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_2",
      created_at: Date.now(),
      schematic_component_id:
        circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: { x: 5, y: 3 },
      new_center: { x: 8, y: 4 },
    },
  ]

  const finalFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: secondEditEvents,
    manualEditsFile: updatedFile,
  })

  // Verify the placement was updated
  expect(finalFile.schematic_placements).toHaveLength(1)
  expect(finalFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 8, y: 4 },
    relative_to: "group_center",
  })
})

test("rejects edit event if original_center doesn't match existing placement", async () => {
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
  }

  // First edit event to set initial position
  const initialEditEvents: ManualEditEvent[] = [
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

  // Apply the initial edit event
  const updatedFile = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: initialEditEvents,
    manualEditsFile,
  })

  // Verify initial placement was added
  expect(updatedFile.schematic_placements).toHaveLength(1)
  expect(updatedFile.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  })

  // Create edit event with mismatched original_center
  const mismatchEditEvent: ManualEditEvent[] = [
    {
      edit_event_type: "edit_schematic_component_location",
      edit_event_id: "test_event_mismatch",
      created_at: Date.now(),
      schematic_component_id:
        circuit.db.schematic_component.list()[0].schematic_component_id,
      original_center: { x: 999, y: 999 }, // Intentionally mismatched
      new_center: { x: 10, y: 10 },
    },
  ]

  // Apply the mismatched edit event
  const afterMismatch = applyEditEventsToManualEditsFile({
    circuitJson,
    editEvents: mismatchEditEvent,
    manualEditsFile: updatedFile,
  })

  // Verify the placement was NOT updated (should remain at previous position)
  expect(afterMismatch.schematic_placements).toHaveLength(1)
  expect(afterMismatch.schematic_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 }, // Should maintain previous position
    relative_to: "group_center",
  })
})
