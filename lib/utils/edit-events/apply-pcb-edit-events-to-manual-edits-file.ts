import type { ManualEditEvent, manual_edits_file } from "@tscircuit/props"
import { z } from "zod"
import type { CircuitJson } from "circuit-json"
import { su } from "@tscircuit/circuit-json-util"

export const applyPcbEditEventsToManualEditsFile = ({
  circuitJson,
  editEvents,
  manualEditsFile,
}: {
  circuitJson: CircuitJson
  editEvents: ManualEditEvent[]
  manualEditsFile: z.infer<typeof manual_edits_file>
}): z.infer<typeof manual_edits_file> => {
  const updatedManualEditsFile = {
    ...manualEditsFile,
    pcb_placements: [...(manualEditsFile.pcb_placements ?? [])],
  }

  for (const editEvent of editEvents) {
    if (editEvent.edit_event_type === "edit_pcb_component_location") {
      const { pcb_component_id, new_center } = editEvent

      const pcb_component = su(circuitJson).pcb_component.get(pcb_component_id)
      if (!pcb_component) continue
      const source_component = su(circuitJson).source_component.get(
        pcb_component.source_component_id,
      )
      if (!source_component) continue

      const existingPlacementIndex =
        updatedManualEditsFile.pcb_placements?.findIndex(
          (p: any) => p.selector === source_component.name,
        )

      const newPlacement = {
        selector: source_component.name,
        center: new_center,
        relative_to: "group_center",
      }

      if (existingPlacementIndex >= 0) {
        updatedManualEditsFile.pcb_placements[existingPlacementIndex] =
          newPlacement
      } else {
        updatedManualEditsFile.pcb_placements.push(newPlacement)
      }
    }
  }

  return updatedManualEditsFile
}
