import type { ManualEditEvent, ManualEditsFile } from "@tscircuit/props";
import type { CircuitJson } from "circuit-json";
import { applyPcbEditEventsToManualEditsFile } from "./apply-pcb-edit-events-to-manual-edits-file";
import { applySchematicEditEventsToManualEditsFile } from "./apply-schematic-edit-events-to-manual-edits-file";

export const applyEditEventsToManualEditsFile = ({
  circuitJson,
  editEvents,
  manualEditsFile,
}: {
  circuitJson: CircuitJson;
  editEvents: ManualEditEvent[];
  manualEditsFile: ManualEditsFile;
}): ManualEditsFile => {
  const schematicEditEvents = editEvents.filter(
    (event) => event.edit_event_type === "edit_schematic_component_location",
  );

  const pcbEditEvents = editEvents.filter(
    (event) => event.edit_event_type === "edit_pcb_component_location",
  );

  let updatedManualEditsFile = manualEditsFile;

  if (schematicEditEvents.length > 0) {
    updatedManualEditsFile = applySchematicEditEventsToManualEditsFile({
      circuitJson,
      editEvents: schematicEditEvents,
      manualEditsFile: updatedManualEditsFile,
    });
  }

  if (pcbEditEvents.length > 0) {
    updatedManualEditsFile = applyPcbEditEventsToManualEditsFile({
      circuitJson,
      editEvents: pcbEditEvents,
      manualEditsFile: updatedManualEditsFile,
    });
  }

  return updatedManualEditsFile;
};
