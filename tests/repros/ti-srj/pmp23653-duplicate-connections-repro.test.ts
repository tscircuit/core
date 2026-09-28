import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import pmp23653PlanarTransformerJson from "./assets/ti-pmp23653-planar-transformer.circuit.json"
import { createTiSrjReproSvg } from "./create-ti-srj-repro-svg"

test("PMP23653 emits one SRJ connection per native Altium net", () => {
  const circuitJson = pmp23653PlanarTransformerJson as AnyCircuitElement[]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const directTraceConnectionCount = simpleRouteJson.connections.filter(
    (connection) => connection.source_trace_id,
  ).length
  const netConnectionCount =
    simpleRouteJson.connections.length - directTraceConnectionCount

  expect(simpleRouteJson.connections).toHaveLength(2)
  expect(directTraceConnectionCount).toBe(0)
  expect(netConnectionCount).toBe(2)

  const svg = createTiSrjReproSvg({
    circuitJson,
    designName: "PMP23653",
    title: "TWO NATIVE NETS BECOME TWO SRJ CONNECTIONS",
    status: "pass",
    statusText: "PASS · one SRJ connection per native net",
    details: [
      "real board topology: 2 source nets · 2 source traces · 18 terminals",
      `SRJ output: ${simpleRouteJson.connections.length} connections (${directTraceConnectionCount} trace + ${netConnectionCount} net)`,
      "endpoint groups: primary winding + secondary winding · no duplicates",
    ],
  })

  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
