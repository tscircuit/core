import {
  checkPadPadClearance,
  checkPadTraceClearance,
  checkViaPadClearance,
} from "@tscircuit/checks"
import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { su } from "@tscircuit/circuit-json-util"
import { TestPointSolver } from "@tscircuit/test-point-rerouter"
import type { SimpleRouteJson } from "@tscircuit/capacity-autorouter"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { materializeRoutedTestPoints } from "lib/utils/autorouting/materialize-routed-test-points"
import input from "../fixtures/test-points/astra-pd-power-supply.srj.json"
import "tests/fixtures/extend-expect-circuit-snapshot"

test("real PD power supply emits connected exposed pads for a bottom probe fixture", async () => {
  const circuit = JSON.parse(
    gunzipSync(
      readFileSync(
        new URL(
          "../fixtures/test-points/astra-pd-power-supply.circuit.json.gz",
          import.meta.url,
        ),
      ),
    ).toString(),
  )
  const clearanceChecks = [
    checkPadPadClearance,
    checkPadTraceClearance,
    checkViaPadClearance,
  ]
  const baselineCounts = clearanceChecks.map(
    (check) => check(circuit, { minClearance: 0.2 }).length,
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
  expect(db.pcb_trace.list()).toHaveLength(219)
  expect(db.pcb_smtpad.list()).toHaveLength(279)
  for (const p of result.testPoints) {
    const component = db.source_component.getWhere({ name: p.name })!
    expect(component.ftype).toBe("simple_test_point")
    const port = db.source_port.getWhere({
      source_component_id: component.source_component_id,
    })!
    const pcbPort = db.pcb_port.getWhere({
      source_port_id: port.source_port_id,
    })!
    const pad = db.pcb_smtpad.getWhere({ pcb_port_id: pcbPort.pcb_port_id })!
    expect(pad).toMatchObject({
      x: p.x,
      y: p.y,
      radius: 0.5,
      layer: "bottom",
      is_covered_with_solder_mask: false,
    })
    const source = db.source_trace.get(p.connectionName)!
    const added = db.source_trace
      .list()
      .find((t) => t.connected_source_port_ids.includes(port.source_port_id))!
    expect(added.connected_source_net_ids).toEqual(
      source.connected_source_net_ids,
    )
    expect(added.subcircuit_connectivity_map_key).toEqual(
      source.subcircuit_connectivity_map_key,
    )
  }
  expect(
    clearanceChecks.map(
      (check) => check(db.toArray(), { minClearance: 0.2 }).length,
    ),
  ).toEqual(baselineCounts)
  for (const point of result.testPoints) {
    db.pcb_note_rect.insert({
      center: point,
      width: 1.8,
      height: 1.8,
      layer: "bottom",
      stroke_width: 0.15,
      color: "#ffcf40",
      has_stroke: true,
    })
    db.pcb_note_text.insert({
      text: point.name,
      anchor_position: { x: point.x + 3, y: point.y - 2 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.7,
      layer: "bottom",
      color: "#ffcf40",
    })
  }
  await expect(
    convertCircuitJsonToPcbSvg(db.toArray(), {
      layer: "bottom",
      showPcbNotes: true,
      showFabricationNotes: false,
      shouldDrawRatsNest: false,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
