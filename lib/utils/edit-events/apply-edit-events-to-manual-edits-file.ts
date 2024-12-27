import type { ManualEditEvent, manual_edits_file } from "@tscircuit/props"
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
  manualEditsFile: z.infer<typeof manual_edits_file>
}): z.infer<typeof manual_edits_file> => {
  const updatedManualEditsFile = {
    ...manualEditsFile,
    schematic_placements: [...(manualEditsFile.schematic_placements ?? [])],
  }

  for (const editEvent of editEvents) {
    if (editEvent.edit_event_type === "edit_schematic_component_location") {
      const { schematic_component_id, new_center } = editEvent

      const schematic_component = su(circuitJson).schematic_component.get(
        schematic_component_id,
      )
      if (!schematic_component) continue
      const source_component = su(circuitJson).source_component.get(
        schematic_component.source_component_id,
      )
      if (!source_component) continue

      // Find if there's an existing placement for this component
      const existingPlacementIndex =
        updatedManualEditsFile.schematic_placements?.findIndex(
          (p: any) => p.selector === source_component.name,
        )

      const newPlacement = {
        selector: source_component.name,
        center: new_center,
        relative_to: "group_center",
      }

      if (existingPlacementIndex >= 0) {
        const existingPlacement =
          updatedManualEditsFile.schematic_placements[existingPlacementIndex]
        // Verify that original_center matches current position before applying update
        if (
          editEvent.original_center.x === existingPlacement.center.x &&
          editEvent.original_center.y === existingPlacement.center.y
        ) {
          // Update existing placement only if positions match
          updatedManualEditsFile.schematic_placements[existingPlacementIndex] =
            newPlacement
        }
        // Skip update if positions don't match
      } else {
        // For new placements, only apply if original_center is {0,0} (default position)
        if (
          editEvent.original_center.x === 0 &&
          editEvent.original_center.y === 0
        ) {
          updatedManualEditsFile.schematic_placements.push(newPlacement)
        }
      }
    }
  }

  return updatedManualEditsFile
}
