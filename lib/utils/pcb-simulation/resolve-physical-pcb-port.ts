import type {
  LayerRef,
  PcbPort,
  SimulationReturnCurrentPortContact,
} from "circuit-json"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Port } from "lib/components/primitive-components/Port"

export function resolvePhysicalPcbPort(
  component: PrimitiveComponent,
  selector: string,
  role: string,
): PcbPort {
  const { db } = component.root!
  const ports = component
    .getSubcircuit()
    .selectAll<Port>(selector)
    .filter((selected) => selected.componentName === "Port")
  if (ports.length !== 1) {
    component.renderError(
      `${role} selector "${selector}" must identify exactly one physical PCB port.`,
    )
  }
  const port = ports[0]
  const pcbPort = port?.pcb_port_id ? db.pcb_port.get(port.pcb_port_id) : null
  const hasPhysicalPad =
    pcbPort &&
    (db.pcb_smtpad.list({ pcb_port_id: pcbPort.pcb_port_id }).length > 0 ||
      db.pcb_plated_hole.list({ pcb_port_id: pcbPort.pcb_port_id }).length > 0)
  if (!pcbPort || !hasPhysicalPad) {
    component.renderError(
      `${role} selector "${selector}" needs a physical PCB pad or plated-hole port.`,
    )
  }
  return pcbPort!
}

/**
 * Contact points copy emitted board-world geometry: right-handed, +X right,
 * +Y toward the board top, +Z above the board; x/y are millimeters. Emitted
 * pad placement already includes footprint rotation and bottom-side mirroring.
 */
export function resolvePhysicalPcbPortContact(
  component: PrimitiveComponent,
  pcbPort: PcbPort,
  selector: string,
  requestedLayer: LayerRef | undefined,
  role: string,
  layerProp: string,
): SimulationReturnCurrentPortContact {
  const { db } = component.root!
  const layers = [...new Set(pcbPort.layers)]
  if (!requestedLayer && layers.length !== 1) {
    component.renderError(
      `${role} "${selector}" spans multiple layers; specify ${layerProp}.`,
    )
  }
  const layer = requestedLayer ?? layers[0]
  const hasPhysicalContact =
    db.pcb_smtpad
      .list({ pcb_port_id: pcbPort.pcb_port_id })
      .some((pad) => pad.layer === layer) ||
    db.pcb_plated_hole
      .list({ pcb_port_id: pcbPort.pcb_port_id })
      .some((hole) => hole.layers.includes(layer))
  if (!layers.includes(layer) || !hasPhysicalContact) {
    component.renderError(
      `${role} "${selector}" has no physical port on layer "${layer}".`,
    )
  }
  return {
    contact_type: "pcb_port",
    pcb_port_id: pcbPort.pcb_port_id,
    x: pcbPort.x,
    y: pcbPort.y,
    layer,
  }
}
