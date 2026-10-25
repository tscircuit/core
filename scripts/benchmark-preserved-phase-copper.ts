import React from "react"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
import { writeFileSync } from "node:fs"
import { createBasicAutorouter } from "../tests/fixtures/createBasicAutorouter"
const { Circuit } = await import(
  pathToFileURL(resolve(process.argv[2] ?? "index.ts")).href
)
const circuit = new Circuit({
  platform: { partsEngineDisabled: true, schematicDisabled: true },
})
let first: any, following: any
circuit.on("autorouting:start", (e: any) => {
  if (e.phaseName === "following-capacity") following = e.simpleRouteJson
})
const algorithm = createBasicAutorouter(async (input) =>
  input.connections.map((c) => {
    const [a, b] = c.pointsToConnect,
      width = c.nominalTraceWidth ?? 0.15
    const wire = (x: number, y: number) => ({
      route_type: "wire" as const,
      x,
      y,
      width,
      layer: a.layer,
    })
    first = {
      type: "pcb_trace" as const,
      pcb_trace_id: `native_${c.name}`,
      connection_name: c.name,
      route: [
        wire(a.x, a.y),
        wire(a.x + 1, a.y + 1),
        wire(b.x - 1, b.y + 1),
        wire(b.x, b.y),
      ],
    }
    return first
  }),
)
const h = React.createElement
const started = performance.now()
circuit.add(
  h(
    "board",
    { width: 18, height: 10 },
    ...[-6, -2, 2, 6].map((pcbX, i) =>
      h("resistor", {
        name: `R${i + 1}`,
        resistance: "1k",
        footprint: "0402",
        pcbX,
      }),
    ),
    h("trace", {
      from: ".R1 > .pin1",
      to: ".R2 > .pin1",
      routingPhaseIndex: 1,
    }),
    h("trace", {
      from: ".R3 > .pin1",
      to: ".R4 > .pin1",
      routingPhaseIndex: 2,
    }),
    h("autoroutingphase", {
      phaseIndex: 1,
      name: "preserved-custom",
      autorouter: "bus_lanes",
      algorithmFn: algorithm,
    }),
    h("autoroutingphase", { phaseIndex: 2, name: "following-capacity" }),
  ),
)
await circuit.renderUntilSettled()
const json = circuit.getCircuitJson(),
  traces = json.filter((e: any) => e.type === "pcb_trace"),
  geometry = (route: any[]) =>
    route.map((p) => ({
      type: p.route_type,
      x: p.x,
      y: p.y,
      width: p.width,
      layer: p.layer,
    })),
  emitted = traces.find(
    (t: any) => t.source_trace_id === first.connection_name,
  ),
  prior = following?.traces?.find(
    (t: any) => t.pcb_trace_id === first.pcb_trace_id,
  )
const report = {
  fixture: "preserved-two-phase-diagonal-four-resistors-v2",
  runtime: Bun.version,
  seconds: (performance.now() - started) / 1000,
  completedTraces: traces.length,
  errors: json
    .filter((e: any) => e.type.endsWith("_error"))
    .map((e: any) => e.type),
  inputTraceCount: following?.traces?.length ?? 0,
  inputObstacleCount: following?.obstacles.length,
  orientedObstacleCount: following?.obstacles.filter(
    (o: any) => o.ccwRotationDegrees !== undefined,
  ).length,
  exactInputCopper:
    !!prior &&
    JSON.stringify(geometry(prior.route)) ===
      JSON.stringify(geometry(first.route)),
  originalCopperUnchanged:
    !!emitted &&
    JSON.stringify(geometry(emitted.route)) ===
      JSON.stringify(geometry(first.route)),
  revision: Bun.spawnSync([
    "git",
    "-C",
    resolve(process.argv[2] ?? "index.ts", ".."),
    "rev-parse",
    "HEAD",
  ])
    .stdout.toString()
    .trim(),
}
console.log(JSON.stringify(report, null, 2))
if (process.argv[3])
  writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + "\n")
if (
  report.completedTraces !== 2 ||
  report.errors.length ||
  !report.originalCopperUnchanged
)
  process.exitCode = 1
