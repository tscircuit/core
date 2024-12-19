import type { ManualEditEvent, manual_edit_file } from "@tscircuit/props"
import { z } from "zod"
import type { CircuitJson } from "circuit-json"
import { su } from "@tscircuit/soup-util"

export const applyEditEventsToManualEditsFile = ({
  circuitJson,
  editEvents,
  manualEditsFile,
}: {
  circuitJson: CircuitJson
  editEvents: ManualEditEvent[]
  manualEditsFile: z.infer<typeof manual_edit_file>
}): z.infer<typeof manual_edit_file> => {
  for (const editEvent of editEvents) {
    if (editEvent.edit_event_type === "edit_schematic_component_location") {
      const { edit_event_id, original_center, new_center, created_at } =
        editEvent

      // TODO
    }
  }

  return manualEditsFile
}
