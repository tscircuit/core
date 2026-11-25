import { parseCableString, type CableConnector } from "@tscircuit/cableprinter"
import type { CadCable } from "circuit-json"
import type { ResolvedAssemblyCableWire } from "./resolve-assembly-cable-wires"

export type AssemblyCableBomRole =
  | "wires"
  | "from_housing"
  | "from_contacts"
  | "to_housing"
  | "to_contacts"

export interface AssemblyCableBomPart {
  name: string
  quantity: number
  /** The parts of the cable this line supplies; identical parts share a line. */
  roles: AssemblyCableBomRole[]
}

const formatMm = (value: number) => String(Number(value.toFixed(2)))

function describeConnector(connector: CableConnector) {
  const jst = /^jst_([a-z]+)_housing$/.exec(connector.kind)
  if (jst && "pinCount" in connector) {
    const family = `JST ${jst[1]!.toUpperCase()}`
    return {
      housing: `${family} housing, ${connector.pinCount} position`,
      contact: `${family} crimp contact`,
    }
  }
  const kind = connector.kind.replaceAll("_", " ")
  return { housing: `${kind} connector`, contact: `${kind} contact` }
}

/** Material breakdown of a wired cable, in parts-list order: wire by gauge
 * and color, then each end's housing and crimp contacts. Wire is counted in
 * cut pieces; contacts are one per wire end. Identical lines are merged.
 */
export function getAssemblyCableBomParts(
  cable: Pick<CadCable, "cableprinter_string" | "nominal_length">,
  wires: ResolvedAssemblyCableWire[],
): AssemblyCableBomPart[] {
  if (!wires.length) return []
  const parts: AssemblyCableBomPart[] = []
  const add = (part: AssemblyCableBomPart) => {
    const existing = parts.find((other) => other.name === part.name)
    if (!existing) {
      parts.push(part)
      return
    }
    existing.quantity += part.quantity
    for (const role of part.roles)
      if (!existing.roles.includes(role)) existing.roles.push(role)
  }
  for (const wire of wires) {
    const description = [
      wire.wire_awg === undefined ? "Wire" : `${wire.wire_awg} AWG wire`,
      wire.color,
      cable.nominal_length === undefined
        ? undefined
        : `${formatMm(cable.nominal_length)} mm`,
    ]
    add({
      name: description.filter(Boolean).join(", "),
      quantity: 1,
      roles: ["wires"],
    })
  }
  const definition = parseCableString(cable.cableprinter_string)
  const from = describeConnector(definition.connectorA)
  const to = describeConnector(definition.connectorB)
  add({ name: from.housing, quantity: 1, roles: ["from_housing"] })
  add({ name: from.contact, quantity: wires.length, roles: ["from_contacts"] })
  add({ name: to.housing, quantity: 1, roles: ["to_housing"] })
  add({ name: to.contact, quantity: wires.length, roles: ["to_contacts"] })
  return parts
}
