import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import "tests/fixtures/get-test-fixture"
import fixture from "../assets/bluetooth-pedometer-clock.circuit.json"

test("Bluetooth pedometer preserves its X48_N clock constraints at SRJ export", () => {
  // Real board: https://tscircuit.com/techmannih/Bluetooth-pedometer
  // ebe6cfad63786434183a4ec6709409ade261dfff, manual copper removed.
  // Frozen source/PCB export avoids the unrelated GND preflight and crystal inflator.
  const circuitJson = structuredClone(fixture) as AnyCircuitElement[]
  const sourceTrace = circuitJson.find(
    (element) => element.type === "source_trace" && element.source_trace_id === "source_trace_217",
  )!
  expect(sourceTrace).toMatchObject({ max_length: 6, max_via_count: 0 })
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const constraints = (simpleRouteJson as typeof simpleRouteJson & {
    routeConstraints?: Array<{ sourceTraceId?: string; maxViaCount?: number; maxLength?: number; pointIds: string[] }>
  }).routeConstraints
  const clockRule = constraints?.find((rule) => rule.sourceTraceId === "source_trace_217")
  expect(clockRule).toMatchObject({ maxViaCount: 0, maxLength: 6, pointIds: ["pcb_port_137"] })
  const groundRule = constraints?.find((rule) => rule.sourceTraceId === "source_trace_135")
  expect(groundRule?.pointIds).toEqual(["pcb_port_148"])
  expect(simpleRouteJson.connections.find((connection) => connection.name === "source_net_29")?.pointsToConnect).toHaveLength(2)
  circuitJson.push({
    type: "pcb_note_text", pcb_note_text_id: "clock_rule_caption",
    text: `X48_N: requested 0 vias / 6 mm; exported ${clockRule ? `${clockRule.maxViaCount} vias / ${clockRule.maxLength} mm` : "missing"}`,
    anchor_position: { x: 0, y: 18 }, anchor_alignment: "center",
    font: "tscircuit2024", font_size: 0.65, layer: "top",
  })
  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
