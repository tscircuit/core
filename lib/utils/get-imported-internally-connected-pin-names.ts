import type { AnyCircuitElement } from "circuit-json"

/** Translate supplier-local port IDs before the imported source records are discarded. */
export const getImportedInternallyConnectedPinNames = (
  circuitJson: AnyCircuitElement[],
): string[][] | undefined => {
  const ports = circuitJson.filter((element) => element.type === "source_port")
  const components = circuitJson
    .filter((element) => element.type === "source_component")
    .filter(
      (component) =>
        component.internally_connected_source_port_ids !== undefined,
    )
  if (!components.length) return undefined
  return components.flatMap((component) =>
    (component.internally_connected_source_port_ids ?? []).flatMap((group) => {
      const resolved = group.map((id) =>
        ports.find(
          (port) =>
            port.source_port_id === id &&
            port.source_component_id === component.source_component_id,
        ),
      )
      if (resolved.some((port) => !port)) return []
      return [
        resolved.map((port) =>
          port!.pin_number !== undefined
            ? `pin${port!.pin_number}`
            : port!.name,
        ),
      ]
    }),
  )
}
