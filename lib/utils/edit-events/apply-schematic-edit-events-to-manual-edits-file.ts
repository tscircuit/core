import type { ManualEditEvent, manual_edits_file } from "@tscircuit/props";
import { su } from "@tscircuit/circuit-json-util";
import type { CircuitJson } from "circuit-json";
import { z } from "zod";

export const applySchematicEditEventsToManualEditsFile = ({
  circuitJson,
  editEvents,
  manualEditsFile,
}: {
  circuitJson: CircuitJson;
  editEvents: ManualEditEvent[];
  manualEditsFile: z.infer<typeof manual_edits_file>;
}): z.infer<typeof manual_edits_file> => {
  const updatedManualEditsFile = {
    ...manualEditsFile,
    schematic_placements: [...(manualEditsFile.schematic_placements ?? [])],
  };

  for (const editEvent of editEvents) {
    if (editEvent.edit_event_type === "edit_schematic_component_location") {
      const { schematic_component_id, new_center } = editEvent;

      const schematic_component = su(circuitJson).schematic_component.get(
        schematic_component_id,
      );
      if (!schematic_component) continue;
      const source_component = su(circuitJson).source_component.get(
        schematic_component.source_component_id,
      );
      if (!source_component) continue;

      const existingPlacementIndex =
        updatedManualEditsFile.schematic_placements?.findIndex(
          (p: any) => p.selector === source_component.name,
        );

      const newPlacement = {
        selector: source_component.name,
        center: new_center,
        relative_to: "group_center",
      };

      if (existingPlacementIndex >= 0) {
        updatedManualEditsFile.schematic_placements[existingPlacementIndex] =
          newPlacement;
      } else {
        updatedManualEditsFile.schematic_placements.push(newPlacement);
      }
    }
  }

  return updatedManualEditsFile;
};
