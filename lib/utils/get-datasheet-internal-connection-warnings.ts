import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import type { Port } from "lib/components/primitive-components/Port"

/** Compare datasheet facts with explicit props, never the imported fallback. */
export const getDatasheetInternalConnectionWarnings = (
  component: NormalComponent,
) => {
  const reported =
    component._fetchedInternallyConnectedPinNames ??
    component._importedInternallyConnectedPinNames ??
    []
  const ports = component._getAllPortsFromChildren()
  const resolvePort = (identifier: string | number): Port | undefined => {
    const name = String(identifier)
    const physical = ports.find(
      (port) =>
        port.physicalPinName === name ||
        (port.props.pinNumber !== undefined &&
          (String(port.props.pinNumber) === name ||
            `pin${port.props.pinNumber}` === name)),
    )
    if (physical) return physical
    const matches = ports.filter((port) => {
      const aliases = port.getNameAndAliases()
      return (
        aliases.includes(name) ||
        (name.startsWith("pin") && aliases.includes(name.slice(3)))
      )
    })
    return matches.length === 1 ? matches[0] : undefined
  }
  const declared = component._parsedProps.internallyConnectedPins as
    | (string | number)[][]
    | undefined
  const declaredGroups = (declared ?? []).map((group) =>
    group.map(resolvePort).filter((port): port is Port => port !== undefined),
  )
  return reported.flatMap((group) => {
    const resolved = group.map(resolvePort)
    if (resolved.some((port) => !port)) return []
    const reportedPorts = [...new Set(resolved as Port[])]
    if (reportedPorts.length < 2) return []
    const connected = new Set<Port>([reportedPorts[0]])
    let changed = true
    while (changed) {
      changed = false
      for (const group of declaredGroups) {
        if (!group.some((port) => connected.has(port))) continue
        for (const port of group) {
          if (!connected.has(port)) {
            connected.add(port)
            changed = true
          }
        }
      }
    }
    if (reportedPorts.every((port) => connected.has(port))) return []
    const pinNames = reportedPorts.map((port) => {
      const aliases = port.getNameAndAliases()
      return (
        aliases.find((name) => !/^(?:pin)?\d+$/.test(name)) ??
        aliases[0] ??
        "unnamed pin"
      )
    })
    const names =
      pinNames.length === 2
        ? pinNames.join(" and ")
        : `${pinNames.slice(0, -1).join(", ")} and ${pinNames.at(-1)}`
    return [
      {
        message: `The datasheet reports pins ${names} are internally connected, but ${declared === undefined ? `the internallyConnectedPins prop isn't set on ${component.getDisplayName()}` : `internallyConnectedPins on ${component.getDisplayName()} does not declare that connection`}.`,
        sourcePortIds: reportedPorts.flatMap((port) =>
          port.source_port_id ? [port.source_port_id] : [],
        ),
      },
    ]
  })
}
