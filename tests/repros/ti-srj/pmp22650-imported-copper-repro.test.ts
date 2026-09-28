import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import pmp22650ArcCropJson from "./assets/ti-pmp22650-imported-arc-crop.circuit.json"
import { createTiSrjReproSvg } from "./create-ti-srj-repro-svg"

test("PMP22650 fresh SRJ ignores imported top-level drawing copper", () => {
  const circuitJson = pmp22650ArcCropJson as AnyCircuitElement[]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    ignoreExistingTopLevelPcbRouteState: true,
  })
  const obstacleConnectionIds = simpleRouteJson.obstacles.flatMap(
    (obstacle) => obstacle.connectedTo,
  )

  expect(obstacleConnectionIds).not.toContain("pcb_trace_altium_arc_4291")

  const svg = createTiSrjReproSvg({
    circuitJson,
    designName: "PMP22650",
    title: "FRESH SRJ EXCLUDES IMPORTED DRAWING COPPER",
    viewport: { minX: 205, minY: 42, maxX: 213, maxY: 52 },
    xRayElementIds: ["pcb_trace_altium_arc_4291"],
    status: "pass",
    statusText: "PASS · imported non-routing copper is excluded",
    details: [
      "actual element: pcb_trace_altium_arc_4291",
      "actual geometry: 49-point Altium circle approximation on top copper",
      `extractor result: ${simpleRouteJson.obstacles.length} valid footprint obstacles · no crash`,
    ],
  })

  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
