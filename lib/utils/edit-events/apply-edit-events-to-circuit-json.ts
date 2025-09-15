import type { ManualEditEvent } from "@tscircuit/props";
import { transformPCBElement } from "@tscircuit/circuit-json-util";
import type {
  AnyCircuitElement,
  CircuitJson,
  PcbComponent,
} from "circuit-json";
import { translate } from "transformation-matrix";
import { applyTraceHintEditEvent } from "./apply-trace-hint-edit-event";

/**
 * Applies edit events directly to a CircuitJson object
 */
export const applyEditEvents = ({
  circuitJson,
  editEvents,
}: {
  circuitJson: CircuitJson;
  editEvents: ManualEditEvent[];
}): CircuitJson => {
  // Create a deep copy to avoid mutating the original
  circuitJson = JSON.parse(JSON.stringify(circuitJson)) as AnyCircuitElement[];

  for (const editEvent of editEvents) {
    if (editEvent.edit_event_type === "edit_pcb_component_location") {
      // Check if the component already has the position specified in the edit event
      const component = circuitJson.find(
        (e: AnyCircuitElement) =>
          e.type === "pcb_component" &&
          e.pcb_component_id === editEvent.pcb_component_id,
      ) as PcbComponent;

      // Only apply the movement if the component isn't already at the target position
      const needsMovement =
        !component ||
        component.center.x !== editEvent.new_center.x ||
        component.center.y !== editEvent.new_center.y;

      if (needsMovement && editEvent.original_center) {
        const mat = translate(
          editEvent.new_center.x - editEvent.original_center.x,
          editEvent.new_center.y - editEvent.original_center.y,
        );
        circuitJson = circuitJson.map((e: any) =>
          e.pcb_component_id !== editEvent.pcb_component_id
            ? e
            : transformPCBElement(e, mat),
        );
      }
    } else if (
      editEvent.edit_event_type === "edit_schematic_component_location"
    ) {
      // For schematic components, we simply update the center directly
      // as they don't use the transformation matrix approach
      circuitJson = circuitJson.map((e: any) => {
        if (
          e.type === "schematic_component" &&
          e.schematic_component_id === editEvent.schematic_component_id
        ) {
          return {
            ...e,
            center: editEvent.new_center,
          };
        }
        return e;
      });
    } else if (editEvent.edit_event_type === "edit_pcb_trace_hint") {
      circuitJson = applyTraceHintEditEvent(circuitJson, editEvent);
    }
  }

  return circuitJson as CircuitJson;
};
