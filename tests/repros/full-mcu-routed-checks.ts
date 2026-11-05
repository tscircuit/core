import { expect } from "bun:test"

/** Assertions for existing physical endpoints, without requiring a trace per
 * internally connected pad. Works on both broken and fixed source outputs. */
export function expectSharedNetRoutes(circuit: any) {
  const db = circuit.db
  const components = db.source_component.list()
  const sources = db.source_port.list()
  const pcb = db.pcb_port.list()
  const traces = db.pcb_trace.list()
  const port = (component: string, pin: number): string => {
    const owner = components.find((c: any) => c.name === component)
    const source = sources.find(
      (p: any) =>
        p.source_component_id === owner?.source_component_id &&
        p.pin_number === pin,
    )
    const matching = pcb.filter(
      (p: any) => p.source_port_id === source?.source_port_id,
    )
    expect(matching).toHaveLength(1)
    return matching[0].pcb_port_id
  }
  const io = port("U1", 4)
  const pullIo = port("R_PULL", 1)
  const power = [port("U1", 2), port("R_LOAD", 2), port("R_PULL", 2)]
  const loadGround = port("R_LOAD", 1)
  const routeBetween = (a: string, b: string) =>
    traces.find(
      (t: any) => t.connectsTo.includes(a) && t.connectsTo.includes(b),
    )
  expect(routeBetween(io, pullIo)).toBeDefined()
  const reached = new Set([power[0]])
  for (let i = 0; i < power.length; i++) {
    for (const trace of traces) {
      if (trace.connectsTo.some((id: string) => reached.has(id))) {
        for (const id of trace.connectsTo)
          if (power.includes(id)) reached.add(id)
      }
    }
  }
  expect(new Set(power)).toEqual(reached)
  // Each trace is actually terminated at its advertised PCB port coordinates.
  for (const trace of traces) {
    const first = trace.route[0] as any
    const last = trace.route.at(-1) as any
    for (const [point, id] of [
      [first, first.start_pcb_port_id],
      [last, last.end_pcb_port_id],
    ] as any[]) {
      const p = pcb.find((candidate: any) => candidate.pcb_port_id === id)
      expect(p).toBeDefined()
      expect(Math.hypot(point.x - p.x, point.y - p.y)).toBeLessThan(1e-6)
    }
  }
  // Signal, supply and ground endpoints must remain on distinct source nets.
  const sourceTrace = db.source_trace.list()
  const netOf = (component: string, pin: number) => {
    const owner = components.find((c: any) => c.name === component)
    const source = sources.find(
      (p: any) =>
        p.source_component_id === owner?.source_component_id &&
        p.pin_number === pin,
    )
    return sourceTrace.find((t: any) =>
      t.connected_source_port_ids.includes(source?.source_port_id),
    )?.connected_source_net_ids[0]
  }
  const netIds = [netOf("U1", 2), netOf("U1", 4), netOf("R_LOAD", 1)]
  expect(netIds.every((id) => typeof id === "string")).toBe(true)
  expect(new Set(netIds).size).toBe(3)
  return { loadGround, traces, pcb, power, io, pullIo }
}
