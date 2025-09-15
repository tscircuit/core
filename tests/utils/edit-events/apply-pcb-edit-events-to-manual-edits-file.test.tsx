import { test, expect } from "bun:test";
import { RootCircuit } from "lib/RootCircuit";
import { applyPcbEditEventsToManualEditsFile } from "lib/utils/edit-events/apply-pcb-edit-events-to-manual-edits-file";
import type { ManualEditEvent } from "@tscircuit/props";

test("applyPcbEditEventsToManualEditsFile updates component locations", async () => {
  // Create a circuit with a resistor
  const circuit = new RootCircuit();
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" />
    </board>,
  );

  circuit.render();

  const circuitJson = circuit.getCircuitJson();

  // Initial manual edits file
  const manualEditsFile = {
    pcb_placements: [],
  };

  // Create edit event to move R1
  const editEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_1",
      created_at: Date.now(),
      pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
      original_center: { x: 0, y: 0 },
      new_center: { x: 5, y: 3 },
      pcb_edit_event_type: "edit_component_location",
    },
  ];

  // Apply the edit events
  const updatedFile = applyPcbEditEventsToManualEditsFile({
    circuitJson,
    editEvents,
    manualEditsFile,
  });

  // Verify the placement was added
  expect(updatedFile.pcb_placements).toHaveLength(1);
  expect(updatedFile.pcb_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 5, y: 3 },
    relative_to: "group_center",
  });

  // Test updating existing placement
  const secondEditEvents: ManualEditEvent[] = [
    {
      edit_event_type: "edit_pcb_component_location",
      edit_event_id: "test_event_2",
      created_at: Date.now(),
      pcb_component_id: circuit.db.pcb_component.list()[0].pcb_component_id,
      original_center: { x: 5, y: 3 },
      new_center: { x: 8, y: 4 },
      pcb_edit_event_type: "edit_component_location",
    },
  ];

  const finalFile = applyPcbEditEventsToManualEditsFile({
    circuitJson,
    editEvents: secondEditEvents,
    manualEditsFile: updatedFile,
  });

  // Verify the placement was updated
  expect(finalFile.pcb_placements).toHaveLength(1);
  expect(finalFile.pcb_placements?.[0]!).toEqual({
    selector: "R1",
    center: { x: 8, y: 4 },
    relative_to: "group_center",
  });
});
