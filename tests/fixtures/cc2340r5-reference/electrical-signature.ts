import type { AnyCircuitElement } from "circuit-json"

/** Component identities/values and physical pin membership of every named net. */
export function getElectricalSignature(circuitJson: AnyCircuitElement[]) {
  const components = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  const ports = circuitJson.filter((element) => element.type === "source_port")
  const nets = circuitJson.filter((element) => element.type === "source_net")
  return {
    components: components
      .map((component) =>
        Object.fromEntries(
          [
            "name",
            "ftype",
            "manufacturer_part_number",
            "capacitance",
            "inductance",
            "resistance",
            "frequency",
          ]
            .filter((property) => property in component)
            .map((property) => [
              property,
              (component as unknown as Record<string, unknown>)[property],
            ]),
        ),
      )
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "en")),
    nets: Object.fromEntries(
      nets.map((net) => [
        net.name,
        ports
          .flatMap((port) => {
            const component = components.find(
              (component) =>
                component.source_component_id === port.source_component_id,
            )
            if (
              !component ||
              port.subcircuit_connectivity_map_key !==
                net.subcircuit_connectivity_map_key
            )
              return []
            return [`${component.name}.${port.pin_number}`]
          })
          .sort(),
      ]),
    ),
  }
}
