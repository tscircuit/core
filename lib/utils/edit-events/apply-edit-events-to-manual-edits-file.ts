import type { ManualEditEvent, manual_edits_file } from "@tscircuit/props"
import { z } from "zod"
import type { CircuitJson } from "circuit-json"
import { applySchematicEditEventsToManualEditsFile } from "./apply-schematic-edit-events-to-manual-edits-file"
import { applyPcbEditEventsToManualEditsFile } from "./apply-pcb-edit-events-to-manual-edits-file"

export const applyEditEventsToManualEditsFile = ({
  circuitJson,
  editEvents,
  manualEditsFile,
}: {
  circuitJson: CircuitJson
  editEvents: ManualEditEvent[]
  manualEditsFile: z.infer<typeof manual_edits_file>
}): z.infer<typeof manual_edits_file> => {

  if (editEvents.some(e => e.edit_event_type === "edit_schematic_component_location")) {
    return applySchematicEditEventsToManualEditsFile({
      circuitJson,
      editEvents,
      manualEditsFile,
    })
  }

  return applyPcbEditEventsToManualEditsFile({
    circuitJson,
    editEvents,
    manualEditsFile,
  })
}
