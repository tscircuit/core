import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import {
  BusLanesPipelineSolver,
  busLengthReports,
  pairLengthReports,
  exteriorPairSpacingReports,
} from "./vendor/solver/lib/index.ts"
import { validateRoutedCopperDrc } from "./vendor/solver/node_modules/@tscircuit/fanout-solver/lib/index.ts"
import {
  packageApproachRegions,
  pointInBox,
} from "./vendor/solver/lib/package-approach-regions.ts"
const root = process.env.PROOF_ROOT ?? `${import.meta.dir}/results`,
  group = Number(process.env.GROUP ?? 0),
  suffix = process.env.SUFFIX ?? "default"
const folder = `${root}/native-group-${group}-${suffix}`
mkdirSync(folder, { recursive: true })
const input = JSON.parse(
  readFileSync(
    process.env.PROOF_INPUT ?? `${import.meta.dir}/fixture/input.json`,
    "utf8",
  ),
)
const bus = input.buses[group],
  pair = input.differentialPairs.find((p: any) =>
    bus.connectionNames.includes(p.connectionNames[0]),
  )
const layer = process.env.LAYER ?? (group === 1 ? "inner3" : "inner2")
const fixed = process.env.ROUTING_FIXED_PATH
  ? JSON.parse(readFileSync(process.env.ROUTING_FIXED_PATH, "utf8")).traces
  : process.env.FIXED
    ? JSON.parse(readFileSync(process.env.FIXED, "utf8"))
    : []
const max =
  group === 2 ? (bus.minLength + bus.maxLength) / 2 : bus.maxLength - 0.05
const pairOnly = !!process.env.PAIR_ONLY
const part = {
  ...input,
  allowedLayers: [layer],
  connections: input.connections.filter((c: any) =>
    (pairOnly ? pair.connectionNames : bus.connectionNames).includes(c.name),
  ),
  differentialPairs: [pair],
  buses: [
    {
      ...bus,
      connectionNames: pairOnly ? pair.connectionNames : bus.connectionNames,
      allowedLayers: [layer],
    },
  ],
  traces: fixed,
}
let centerlines: any = undefined
if (process.env.X) {
  const regions = packageApproachRegions(part, 0.26)
  const c = part.connections.find(
    (c: any) => c.name === pair.connectionNames[0],
  )
  const a = regions.find((r) => pointInBox(c.pointsToConnect[0], r.pads))!,
    b = regions.find((r) => pointInBox(c.pointsToConnect[1], r.pads))!
  const x = Number(process.env.X)
  centerlines = [
    [
      { x, y: Math.ceil((a.copper.minY + 0.03) * 10) / 10 },
      { x, y: Math.floor((b.copper.maxY - 0.03) * 10) / 10 },
    ],
  ]
}
const opts = {
  maxSearchIterations: 2_000_000,
  maxLaneIterations: 1_000_000,
  singleCarrier: {
    busTargetLength: Number(process.env.TARGET ?? max - 0.127),
    centerlines,
    fixedConnections: input.connections.filter((c: any) =>
      fixed.some((t: any) => t.connection_name === c.name),
    ),
    gridStep: Number(process.env.GRID_STEP ?? 0.1),
    maxPasses: 20,
    maxLocalPasses: 12,
    maxExpansionsPerRoute: 150000,
  },
}
writeFileSync(`${folder}/input.json`, JSON.stringify(part))
writeFileSync(`${folder}/options.json`, JSON.stringify(opts))
const solver = new BusLanesPipelineSolver(part, opts)
const start = performance.now()
let log = start
while (
  !solver.solved &&
  !solver.failed &&
  performance.now() - start < Number(process.env.SECONDS ?? 150) * 1000
) {
  solver.step()
  if ((solver as any).acceptedTraces) solver.tryFinalAcceptance()
  if (performance.now() - log > 10000) {
    console.log(
      JSON.stringify({
        seconds: (performance.now() - start) / 1000,
        phase: solver.phase,
        iterations: solver.iterations,
        progress: solver.stats?.nativeSingleCarrier,
      }),
    )
    log = performance.now()
  }
}
const buses = busLengthReports(part, solver.traces),
  pairs = pairLengthReports(part, solver.traces),
  coupling = exteriorPairSpacingReports(part, solver.traces)
let drc: any = null
if (solver.solved)
  drc = validateRoutedCopperDrc({
    inputSrj: {
      ...part,
      connections: [
        ...part.connections,
        ...opts.singleCarrier.fixedConnections,
      ],
    },
    routedSrj: {
      ...part,
      connections: [
        ...part.connections,
        ...opts.singleCarrier.fixedConnections,
      ],
      traces: [...fixed, ...solver.traces],
    },
    clearance: 0.1,
    allowBlindAndBuriedVias: false,
  })
const accepted =
  part.connections.every(
    (c: any) =>
      solver.traces.filter((t: any) => t.connection_name === c.name).length ===
      1,
  ) &&
  solver.solved &&
  buses.every(
    (r: any) => r.matched && r.aboveMinimumLength && r.withinLengthLimit,
  ) &&
  pairs.every((r: any) => r.matched) &&
  coupling.every((r: any) => r.matched) &&
  drc?.valid
const report = {
  accepted,
  seconds: (performance.now() - start) / 1000,
  solved: solver.solved,
  failed: solver.failed,
  error: solver.error,
  phase: solver.phase,
  buses,
  pairs,
  coupling,
  drc,
  stats: solver.stats,
}
writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2))
writeFileSync(`${folder}/traces.json`, JSON.stringify(solver.traces))
console.log(JSON.stringify({ ...report, stats: undefined }))

if (accepted && process.env.ROUTING_OUTPUT_PATH)
  writeFileSync(
    process.env.ROUTING_OUTPUT_PATH,
    JSON.stringify({ traces: [...fixed, ...solver.traces] }),
  )
process.exit(accepted ? 0 : 1)
