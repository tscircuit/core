import type { ManualEditEvent } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { applySchematicEditEventsToManualEditsFile } from "lib/utils/edit-events/apply-schematic-edit-events-to-manual-edits-file"

test("applySchematicEditEventsToManualEditsFile updates component locations", async () => {
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
  const updatedFile = applySchematicEditEventsToManualEditsFile({
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

  const finalFile = applySchematicEditEventsToManualEditsFile({
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