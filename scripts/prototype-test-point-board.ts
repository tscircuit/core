import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import { TestPointSolver } from "@tscircuit/test-point-rerouter"
import type { SimpleRouteJson } from "@tscircuit/capacity-autorouter"
import {
  checkPadPadClearance,
  checkPadTraceClearance,
  checkViaPadClearance,
} from "@tscircuit/checks"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
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
const checks = {
  padPad: checkPadPadClearance,
  padTrace: checkPadTraceClearance,
  viaPad: checkViaPadClearance,
}
const before = Object.fromEntries(
  Object.entries(checks).map(([name, check]) => [
    name,
    check(circuit, { minClearance: 0.2 }).length,
  ]),
)
const db = su(structuredClone(circuit))
const solver = new TestPointSolver(input as SimpleRouteJson, {
  requests: [
    {
      name: "TP_AUTO_SDA",
      pcbTraceId: "source_net_33_mst0_0",
      layer: "bottom",
      diameter: 1,
    },
    {
      name: "TP_AUTO_SCL",
      pcbTraceId: "source_net_34_mst0_0",
      layer: "bottom",
      diameter: 1,
    },
    {
      name: "TP_AUTO_OUTPUT_EN",
      pcbTraceId: "source_net_50_mst1_0",
      layer: "bottom",
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
const after = Object.fromEntries(
  Object.entries(checks).map(([name, check]) => [
    name,
    check(db.toArray(), { minClearance: 0.2 }).length,
  ]),
)
const report = {
  board: "astra/pd-power-supply",
  release: "57387f49-bd91-4277-8a82-706b1575c5ed",
  clearanceMm: 0.2,
  before,
  after,
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
// Review-only annotations: keep them out of the manufacturing circuit JSON.
for (const [index, p] of result.testPoints.entries()) {
  db.pcb_note_rect.insert({
    center: { x: p.x, y: p.y },
    width: 1.8,
    height: 1.8,
    layer: "bottom",
    stroke_width: 0.15,
    color: "#ffcf40",
    has_stroke: true,
  })
  const anchor = { x: p.x + (index === 2 ? -5 : 5), y: p.y - 3 }
  db.pcb_note_path.insert({
    route: [p, anchor],
    layer: "bottom",
    stroke_width: 0.1,
    color: "#ffcf40",
  })
  db.pcb_note_text.insert({
    text: p.name.replace("TP_AUTO_", "TP_"),
    anchor_position: anchor,
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.9,
    layer: "bottom",
    color: "#ffcf40",
  })
}
for (const [name, data] of [
  ["before", circuit],
  ["after", db.toArray()],
] as const) {
  const svg = convertCircuitJsonToPcbSvg(data, {
    layer: "bottom",
    showPcbNotes: true,
    drawPaddingOutsideBoard: false,
    showFabricationNotes: false,
    shouldDrawRatsNest: false,
    width: 1600,
    height: 900,
    matchBoardAspectRatio: true,
  })
  writeFileSync(`${directory}/pd-power-supply-${name}.svg`, svg)
  writeFileSync(
    `${directory}/pd-power-supply-${name}.png`,
    new Resvg(svg).render().asPng(),
  )
}
