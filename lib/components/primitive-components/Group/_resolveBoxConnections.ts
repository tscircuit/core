import type { Group } from "./Group"

export type ResolvedBoxPin = { pinName: string; sck: string }

export function resolveBoxConnections(group: Group): ResolvedBoxPin[] {
  const out: ResolvedBoxPin[] = []
  const conns = group.getSchConnections()
  for (const [pinName, selector] of Object.entries(conns)) {
    const target: any = group.selectOne(selector) // local to subcircuit
    if (!target) {
      throw new Error(
        `[${group.getString()}] connections["${pinName}"] not found: ${selector}`,
      )
    }
    const sck =
      target?.subcircuit_connectivity_map_key ??
      target?.matchedNet?.subcircuit_connectivity_map_key ??
      target?.matchedPort?.subcircuit_connectivity_map_key

    if (!sck) {
      const stable = String(target.name ?? target.ref ?? selector ?? pinName)
      out.push({
        pinName,
        sck: `${group.name ?? `unnamedsubcircuit${(group as any)._renderId}`}_${stable}`,
      })
    } else {
      out.push({ pinName, sck })
    }
  }
  return out
}
