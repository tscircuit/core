import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import { TestPointSolver } from "@tscircuit/test-point-rerouter"
import type { SimpleRouteJson } from "@tscircuit/capacity-autorouter"
import { compareBoardDrc } from "../tests/fixtures/test-points/compare-board-drc"
import { getBoardComparisonSvg } from "../tests/fixtures/test-points/get-board-comparison-svg"
import { Resvg } from "@resvg/resvg-js"
import { materializeRoutedTestPoints } from "../lib/utils/autorouting/materialize-routed-test-points"
import input from "../tests/fixtures/test-points/astra-pd-power-supply.srj.json"

const directory = process.argv[2] ?? "test-point-artifacts"
mkdirSync(directory, { recursive: true })
const circuit = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL(
        "../tests/fixtures/test-points/astra-pd-power-supply.circuit.json.gz",
        import.meta.url,
      ),
    ),
  ).toString(),
)
const db = su(structuredClone(circuit))
const solver = new TestPointSolver(input as SimpleRouteJson, {
  requests: [
    {
      name: "TP_AUTO_SDA",
      pcbTraceId: "source_net_33_mst1_0",
      layer: "top",
      diameter: 1,
    },
    {
      name: "TP_AUTO_SCL",
      pcbTraceId: "source_net_34_mst0_0",
      layer: "top",
      diameter: 1,
    },
    {
      name: "TP_AUTO_OUTPUT_EN",
      pcbTraceId: "source_net_50_mst0_0",
      layer: "top",
      diameter: 1,
    },
  ],
  clearance: 0.2,
  minProbeSpacing: 2.54,
  maxDetour: 1,
})
solver.solve()
const result = solver.getOutput()
for (const trace of result.traces!)
  db.pcb_trace.update(trace.pcb_trace_id, { route: trace.route as any })
materializeRoutedTestPoints(
  db,
  result.testPoints.map((p) => ({ ...p, sourceTraceId: p.connectionName })),
  "subcircuit_source_group_1",
)
const drc = await compareBoardDrc(circuit, db.toArray())
if (drc.added.length)
  throw new Error("Test point phase introduced new DRC findings")
const report = {
  board: "astra/pd-power-supply",
  release: "57387f49-bd91-4277-8a82-706b1575c5ed",
  ...drc,
  testPoints: result.testPoints,
}
console.log(report)
writeFileSync(`${directory}/validation.json`, JSON.stringify(report, null, 2))
writeFileSync(
  `${directory}/pd-power-supply-with-test-points.circuit.json`,
  JSON.stringify(db.toArray(), null, 2),
)
writeFileSync(
  `${directory}/probe-targets.json`,
  JSON.stringify(
    {
      ...report,
      units: "mm",
      coordinateFrame: "board (+X right, +Y up), not mirrored",
    },
    null,
    2,
  ),
)
// Review annotations and hidden pours do not alter the emitted manufacturing geometry.
const comparison = getBoardComparisonSvg(
  circuit,
  db.toArray(),
  result.testPoints,
)
writeFileSync(`${directory}/pd-power-supply-before-after.svg`, comparison)
writeFileSync(
  `${directory}/pd-power-supply-before-after.png`,
  new Resvg(comparison).render().asPng(),
)
