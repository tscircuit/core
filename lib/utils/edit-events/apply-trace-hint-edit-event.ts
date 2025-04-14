import type { AnyCircuitElement } from "circuit-json"
import { su } from "@tscircuit/soup-util"
import type { EditTraceHintEvent } from "@tscircuit/props"

export const applyTraceHintEditEvent = (
  soup: AnyCircuitElement[],
  edit_event: EditTraceHintEvent,
): AnyCircuitElement[] => {
  const existingTraceHint = su(soup).pcb_trace_hint.get(
    edit_event.pcb_trace_hint_id!,
  )

  if (existingTraceHint) {
    // biome-ignore lint: Parameter reassignment
    soup = soup.map((e: any) =>
      e.pcb_trace_hint_id === edit_event.pcb_trace_hint_id
        ? {
            ...e,
            route: edit_event.route,
          }
        : e,
    )
  } else {
    const pcbPort = su(soup).pcb_port.get(edit_event.pcb_port_id!)
    // biome-ignore lint: Parameter reassignment
    soup = soup
      .filter(
        (e) =>
          !(
            e.type === "pcb_trace_hint" &&
            e.pcb_port_id === edit_event.pcb_port_id
          ),
      )
      .concat([
        {
          type: "pcb_trace_hint",
          pcb_trace_hint_id: edit_event.pcb_trace_hint_id!,
          route: edit_event.route,
          pcb_port_id: edit_event.pcb_port_id!,
          pcb_component_id: pcbPort?.pcb_component_id!,
        },
      ])
  }

  return soup
}
