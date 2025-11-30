import type { PcbPort, SourcePort } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Port } from "lib/components/primitive-components/Port/Port"

export function inflateSourcePort(
  sourcePort: SourcePort,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  // Only inflate group ports (ports with no source_component_id)
  // Component ports are created when their parent component is inflated
  if (sourcePort.source_component_id !== null) {
    return
  }

  // Find the corresponding pcb_port from the subcircuit's circuit JSON
  const pcbPortFromInjection = injectionDb.pcb_port.getWhere({
    source_port_id: sourcePort.source_port_id,
  }) as PcbPort | null

  // Create a Port instance
  const port = new Port({
    name: sourcePort.name,
    pinNumber: sourcePort.pin_number,
  })

  // Add the port to its group if it has one, otherwise add to subcircuit
  if (
    sourcePort.source_group_id &&
    groupsMap?.has(sourcePort.source_group_id)
  ) {
    const group = groupsMap.get(sourcePort.source_group_id)!
    group.add(port)
  } else {
    subcircuit.add(port)
  }

  // Set the source_port_id from the injected circuit JSON
  // This is needed so the port can be found by selectors
  // Normally this would be set during doInitialSourceRender, but since
  // we're inflating from circuit JSON, we set it here
  port.source_port_id = sourcePort.source_port_id
  port.source_component_id = subcircuit.source_component_id

  // After adding to subcircuit, the port should be able to access the root
  // and we can insert the pcb_port into the main circuit database
  const root = subcircuit.root
  if (root && pcbPortFromInjection) {
    const { db } = root

    // Insert the pcb_port into the main circuit database
    const pcb_port = db.pcb_port.insert({
      pcb_component_id: undefined as any,
      layers: pcbPortFromInjection.layers,
      subcircuit_id: subcircuit.subcircuit_id ?? undefined,
      pcb_group_id: subcircuit.getGroup()?.pcb_group_id ?? undefined,
      x: pcbPortFromInjection.x,
      y: pcbPortFromInjection.y,
      source_port_id: sourcePort.source_port_id,
      is_board_pinout: false,
    })

    port.pcb_port_id = pcb_port.pcb_port_id
  }
}
