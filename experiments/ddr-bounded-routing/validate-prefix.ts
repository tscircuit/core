/** Validate a stage prefix; this is explicitly NOT whole-board completion.
 * Geometry is board-world mm: +X right, +Y up, right-handed; route vertices
 * are points. Source ownership, not route endpoint labels, assigns nets.
 */
import { readFileSync, writeFileSync } from "node:fs"
import {
  busLengthReports,
  pairLengthReports,
  exteriorPairSpacingReports,
} from "./vendor/solver/lib/index.ts"
import { validateRoutedCopperDrc } from "./vendor/solver/node_modules/@tscircuit/fanout-solver/lib/index.ts"
import * as checks from "@tscircuit/checks"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
const input = JSON.parse(
  readFileSync(
    process.env.PROOF_INPUT ?? `${import.meta.dir}/fixture/input.json`,
    "utf8",
  ),
)
const native = JSON.parse(
  readFileSync(
    process.env.PROOF_NATIVE ??
      `${import.meta.dir}/fixture/native.circuit.json`,
    "utf8",
  ),
)
const candidate = JSON.parse(
  readFileSync(process.env.ROUTING_OUTPUT_PATH!, "utf8"),
)
const traces = candidate.traces
const groups = (process.env.EXPECTED_GROUPS ?? "0").split(",").map(Number)
const names = new Set(groups.flatMap((i) => input.buses[i].connectionNames))
const complete =
  traces.length === names.size &&
  [...names].every(
    (name) =>
      traces.filter((t: any) => t.connection_name === name).length === 1,
  )
const fixed = process.env.ROUTING_FIXED_PATH
  ? JSON.parse(readFileSync(process.env.ROUTING_FIXED_PATH, "utf8")).traces
  : []
const preserved = fixed.every((trace: any) =>
  traces.some((t: any) => JSON.stringify(t) === JSON.stringify(trace)),
)
const part = {
  ...input,
  allowedLayers: ["top", "inner2", "inner3", "bottom"],
  connections: input.connections.filter((c: any) => names.has(c.name)),
  buses: groups.map((i) => ({
    ...input.buses[i],
    allowedLayers: ["inner2", "inner3"],
  })),
  differentialPairs: input.differentialPairs.filter((p: any) =>
    p.connectionNames.every((n: string) => names.has(n)),
  ),
}
const drc = validateRoutedCopperDrc({
  inputSrj: part,
  routedSrj: { ...part, traces },
  clearance: 0.1,
  allowBlindAndBuriedVias: false,
})
const buses = busLengthReports(part, traces),
  pairs = pairLengthReports(part, traces),
  coupling = exteriorPairSpacingReports(part, traces)
const board = native.find((e: any) => e.type === "pcb_board")
const endpoints = traces.every((t: any) => {
  const connection = input.connections.find(
    (c: any) => c.name === t.connection_name,
  )
  if (!connection) return false
  const wires = t.route.filter((p: any) => p.route_type === "wire")
  return connection.pointsToConnect.every((p: any) =>
    [wires[0], wires.at(-1)].some(
      (q) =>
        q && q.layer === p.layer && Math.hypot(q.x - p.x, q.y - p.y) < 1e-5,
    ),
  )
})
for (const original of traces) {
  const trace = structuredClone(original),
    c = input.connections.find((c: any) => c.name === trace.connection_name)
  if (!c) continue
  trace.source_trace_id = c.source_trace_id
  trace.subcircuit_id = board.subcircuit_id
  trace.pcb_group_id = "pcb_group_0"
  native.push(trace)
  let i = 0
  for (const p of trace.route)
    if (p.route_type === "via")
      native.push({
        type: "pcb_via",
        pcb_via_id: `proof_${trace.pcb_trace_id}_${i++}`,
        pcb_trace_id: trace.pcb_trace_id,
        source_trace_id: trace.source_trace_id,
        subcircuit_id: board.subcircuit_id,
        x: p.x,
        y: p.y,
        outer_diameter: 0.3,
        hole_diameter: 0.15,
        layers: ["top", "inner1", "inner2", "inner3", "inner4", "bottom"],
      })
}
const connMap = getFullConnectivityMapFromCircuitJson(native)
const nativeFindings: Record<string, unknown[]> = {}
for (const check of [
  "checkEachPcbTraceNonOverlapping",
  "checkPadTraceClearance",
  "checkViaPadClearance",
  "checkViaTraceClearance",
  "checkDifferentNetViaSpacing",
  "checkHoleTraceClearance",
  "checkViasInPads",
  "checkTracesAreContiguous",
  "checkPcbTraceStyle",
  "checkPcbBusLengthSkew",
  "checkPcbRoutingConstraints",
])
  nativeFindings[check] = await (checks as any)[check](native, { connMap })
const passed =
  complete &&
  preserved &&
  endpoints &&
  drc.valid &&
  buses.every(
    (b) => b.matched && b.withinLengthLimit && b.aboveMinimumLength,
  ) &&
  pairs.every((p) => p.matched) &&
  coupling.every((p) => p.applicable && p.matched) &&
  Object.values(nativeFindings).every((a) => a.length === 0)
const report = {
  passed,
  scope: "selected_ddr_groups_only",
  complete,
  preserved,
  endpoints,
  routedConnections: traces.length,
  wholeBoardComplete: false,
  drc,
  buses,
  pairs,
  coupling,
  nativeFindings,
}
writeFileSync(
  process.env.ROUTING_OUTPUT_PATH! + ".validation.json",
  JSON.stringify(report, null, 2),
)
console.log(
  JSON.stringify({
    passed,
    complete,
    preserved,
    endpoints,
    nativeFindings: Object.fromEntries(
      Object.entries(nativeFindings).map(([k, v]) => [k, v.length]),
    ),
  }),
)
process.exit(passed ? 0 : 1)
