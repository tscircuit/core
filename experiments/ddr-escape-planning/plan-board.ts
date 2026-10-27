import { readFileSync, writeFileSync } from "node:fs"
import { routeAlternateSignalDogbones } from "./vendor/solver/lib/alternate-signal-dogbones"
import { runAllPlacementChecks } from "@tscircuit/checks"
import { proposeEscapePlacement } from "./plan"
const folder = process.argv[2],
  input = JSON.parse(readFileSync(`${folder}/input.json`, "utf8")),
  native = JSON.parse(readFileSync(`${folder}/native.circuit.json`, "utf8"))
const source = new Map(
  native
    .filter((e: any) => e.type === "source_component")
    .map((e: any) => [e.source_component_id, e]),
)
const caps = native.filter(
  (e: any) =>
    e.type === "pcb_component" &&
    (source.get(e.source_component_id) as any)?.ftype === "simple_capacitor",
)
const placements = caps.map((e: any) => ({
  componentId: e.pcb_component_id,
  x: e.center.x,
  y: e.center.y,
  movable: true,
}))
const positions = new Map(placements.map((p: any) => [p.componentId, p]))
const translate = (e: any, dx: number, dy: number): any => {
  if (Array.isArray(e)) return e.map((v) => translate(v, dx, dy))
  if (!e || typeof e !== "object") return e
  const out = Object.fromEntries(
    Object.entries(e).map(([k, v]) => [k, translate(v, dx, dy)]),
  )
  if (typeof e.x === "number" && typeof e.y === "number") {
    out.x += dx
    out.y += dy
  }
  return out
}
const options = {
  targetLayers: new Map(input.connections.map((c: any) => [c.name, "inner2"])),
  viaDiameter: 0.3,
  viaHoleDiameter: 0.15,
  traceWidth: 0.1,
  clearance: 0.1,
  holeToHoleClearance: 0.1,
  allowBlindAndBuriedVias: false,
}
const works = (part: any) => {
  for (let a = 0; a < 4; a++)
    try {
      routeAlternateSignalDogbones(part, options, a)
      return true
    } catch {}
  return false
}
let evaluations = 0
const assess = async (candidate: any[]) => {
  const delta = new Map(
    candidate.map((p) => {
      const original: any = positions.get(p.componentId)
      return [p.componentId, { x: p.x - original.x, y: p.y - original.y }]
    }),
  )
  const moved = (e: any) => {
    const d: any = delta.get(e.pcb_component_id ?? e.componentId)
    return d && (d.x || d.y) ? translate(e, d.x, d.y) : e
  }
  const physical = native.map(moved)
  const placementValid = !(await runAllPlacementChecks(physical)).some(
    (e: any) => e.type.endsWith("_error"),
  )
  const trial = { ...input, obstacles: input.obstacles.map(moved) }
  evaluations++
  if (!placementValid)
    return {
      placementValid: false,
      escapedConnections: 0,
      requiredConnections: 47,
      jointlyFeasible: false,
      blockedBy: [],
    }
  if (works(trial))
    return {
      placementValid: true,
      escapedConnections: 47,
      requiredConnections: 47,
      jointlyFeasible: true,
      blockedBy: [],
    }
  const failed = trial.connections.filter(
    (c: any) =>
      !works({ ...trial, connections: [c], buses: [], differentialPairs: [] }),
  )
  const blockers = new Set<string>()
  for (const c of failed)
    for (const p of c.pointsToConnect)
      for (const o of trial.obstacles)
        if (
          positions.has(o.componentId) &&
          Math.hypot(p.x - o.center.x, p.y - o.center.y) < 1.2
        )
          blockers.add(o.componentId)
  return {
    placementValid: true,
    escapedConnections: 47 - failed.length,
    requiredConnections: 47,
    jointlyFeasible: false,
    blockedBy: [...blockers],
  }
}
const before = await assess(placements)
console.log("BASELINE", JSON.stringify(before))
if (process.env.PROBE_ONLY) process.exit(0)
const offsets = []
for (const radius of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
  for (const direction of [
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
  ])
    offsets.push({ x: radius * direction.x, y: radius * direction.y })
const start = performance.now()
const result = await proposeEscapePlacement({
  placements,
  offsets,
  maxDisplacementMm: 0.6,
  maxEvaluations: 128,
  assess,
})
const delta = new Map(
  result.placements.map((p) => {
    const original: any = positions.get(p.componentId)
    return [p.componentId, { x: p.x - original.x, y: p.y - original.y }]
  }),
)
const moved = (e: any) => {
  const d: any = delta.get(e.pcb_component_id ?? e.componentId)
  return d && (d.x || d.y) ? translate(e, d.x, d.y) : e
}
writeFileSync(
  `${folder}/planned-input.json`,
  JSON.stringify({ ...input, obstacles: input.obstacles.map(moved) }),
)
writeFileSync(
  `${folder}/planned-native.json`,
  JSON.stringify(native.map(moved)),
)
const report = { before, ...result, milliseconds: performance.now() - start }
writeFileSync(`${folder}/planning-report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ ...report, placements: undefined }))
