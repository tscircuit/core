import { parseCableString, type CableConnector } from "@tscircuit/cableprinter"
import type { CadCable, CadCableWire } from "circuit-json"
import type { AssemblyCable } from "./AssemblyCable"
import { AssemblyCableWire } from "./AssemblyCableWire"

export type ResolvedAssemblyCableWire = Omit<
  CadCableWire,
  "type" | "cad_cable_wire_id" | "cad_cable_id"
>

const contactCount = (connector: CableConnector) =>
  "pinCount" in connector ? connector.pinCount : undefined

/** Pin-to-pin wiring stated by assembly.cablewire children, in from-pin
 * order. Pins are 1-based contact positions on the cable's own connectors;
 * a cavity with no wire stays empty. Gauge is inherited from the cable.
 */
export function resolveAssemblyCableWires(
  cable: AssemblyCable,
  cableprinterString: CadCable["cableprinter_string"],
): ResolvedAssemblyCableWire[] {
  if (cable.children.some((child) => !(child instanceof AssemblyCableWire)))
    throw new Error(
      `assembly.cable "${cable.name}" can contain only assembly.cablewire children`,
    )
  const wires = cable.children as AssemblyCableWire[]
  if (!wires.length) return []
  const definition = parseCableString(cableprinterString)
  for (const [end, connector, pin] of [
    ["from", definition.connectorA, "fromPin"],
    ["to", definition.connectorB, "toPin"],
  ] as const) {
    const count = contactCount(connector)
    if (count === undefined)
      throw new Error(
        `assembly.cable "${cable.name}" has wires, but its ${end} connector has no numbered contacts`,
      )
    const used = new Set<number>()
    for (const wire of wires) {
      const position = wire._parsedProps[pin]
      if (position > count)
        throw new Error(
          `assembly.cable "${cable.name}" wire uses ${pin}=${position}, but its ${end} connector has ${count} contacts`,
        )
      if (used.has(position))
        throw new Error(
          `assembly.cable "${cable.name}" lands two wires on ${pin}=${position}`,
        )
      used.add(position)
    }
  }
  return wires
    .map((wire) => ({
      from_pin_number: wire._parsedProps.fromPin,
      to_pin_number: wire._parsedProps.toPin,
      color: wire._parsedProps.color,
      wire_awg: wire._parsedProps.awg ?? cable._parsedProps.wireAwg,
      name: wire._parsedProps.name,
    }))
    .sort((a, b) => a.from_pin_number - b.from_pin_number)
}
