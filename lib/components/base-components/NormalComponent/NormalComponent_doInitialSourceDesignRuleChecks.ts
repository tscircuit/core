import type { NormalComponent } from "./NormalComponent"
import type { Port } from "../../primitive-components/Port"

export const NormalComponent_doInitialSourceDesignRuleChecks = (
  component: NormalComponent,
): void => {
  const { db } = component.root!
  if (!component.source_component_id) return

  const ports = component.selectAll("port") as Port[]
  const traces = db.source_trace.list()

  const connected = new Set<string>()
  for (const trace of traces) {
    for (const id of trace.connected_source_port_ids) {
      connected.add(id)
    }
  }

  const internalGroups = component._getInternallyConnectedPins()
  for (const group of internalGroups) {
    if (
      group.some((p) => p.source_port_id && connected.has(p.source_port_id))
    ) {
      for (const p of group) {
        if (p.source_port_id) connected.add(p.source_port_id)
      }
    }
  }

  for (const port of ports) {
    if (!port.source_port_id) continue
    if (!shouldCheckPortForMissingTrace(component, port)) continue
    if (connected.has(port.source_port_id)) continue
    db.source_pin_missing_trace_warning.insert({
      message: `Port ${port.getNameAndAliases()[0]} on ${component.props.name} is missing a trace`,
      source_component_id: component.source_component_id,
      source_port_id: port.source_port_id,
      subcircuit_id: component.getSubcircuit().subcircuit_id ?? undefined,
      warning_type: "source_pin_missing_trace_warning",
    })
  }
}

export const shouldCheckPortForMissingTrace = (
  component: NormalComponent,
  port: Port,
): boolean => {
  if (component.config.componentName === "Interconnect") {
    return false
  }
  if (component.config.componentName === "Chip") {
    const pinAttributes = (component.props as any).pinAttributes
    if (!pinAttributes) return false
    for (const alias of port.getNameAndAliases()) {
      const attrs = pinAttributes[alias]
      if (
        attrs?.requiresPower ||
        attrs?.requiresGround ||
        attrs?.requiresVoltage !== undefined
      ) {
        return true
      }
    }
    return false
  }
  return true
}
