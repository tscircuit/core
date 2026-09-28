import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import pmp23653PlanarTransformerJson from "./assets/ti-pmp23653-planar-transformer.circuit.json"
import { createTiSrjReproSvg } from "./create-ti-srj-repro-svg"

test("PMP23653 fresh SRJ obstacles keep semantic connectivity only", () => {
  const fullCircuitJson = pmp23653PlanarTransformerJson as AnyCircuitElement[]
  // Imported route primitives are omitted here only to isolate connectivity
  // expansion from the independent imported-copper failure covered by the
  // PMP22650 repro. Every remaining record is unchanged real board data.
  const circuitJson = fullCircuitJson.filter(
    (element) => element.type !== "pcb_trace",
  )
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const connectedToCounts = simpleRouteJson.obstacles.map(
    (obstacle) => obstacle.connectedTo.length,
  )
  const maxConnectedToCount = Math.max(...connectedToCounts)
  const totalConnectedToCount = connectedToCounts.reduce(
    (sum, count) => sum + count,
    0,
  )
  const foreignPhysicalIdCount = simpleRouteJson.obstacles.reduce(
    (count, obstacle) =>
      count +
      obstacle.connectedTo.filter(
        (id) =>
          id.startsWith("pcb_via_") ||
          id.startsWith("pcb_port_") ||
          id.startsWith("source_port_"),
      ).length,
    0,
  )

  expect(maxConnectedToCount).toBe(4)
  expect(totalConnectedToCount).toBe(72)
  expect(foreignPhysicalIdCount).toBe(0)

  const svg = createTiSrjReproSvg({
    circuitJson: fullCircuitJson,
    designName: "PMP23653",
    title: "FRESH SRJ KEEPS SEMANTIC OBSTACLE CONNECTIVITY",
    status: "pass",
    statusText: "PASS · physical route IDs stay out of fresh SRJ",
    details: [
      `actual board: ${simpleRouteJson.obstacles.length} plated-hole obstacles · 29 imported vias`,
      `largest connectedTo list: ${maxConnectedToCount} IDs (own + connectivity key + net + trace)`,
      `all obstacle references: ${totalConnectedToCount} IDs · no foreign physical IDs`,
    ],
  })

  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
