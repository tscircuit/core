import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import pmp22650ArcCropJson from "./assets/ti-pmp22650-imported-arc-crop.circuit.json"
import { createTiSrjReproSvg } from "./create-ti-srj-repro-svg"

test("PMP22650 fresh SRJ ignores imported top-level drawing copper", () => {
  const circuitJson = pmp22650ArcCropJson as AnyCircuitElement[]
  let extractionError: Error | undefined

  try {
    getSimpleRouteJsonFromCircuitJson({
      circuitJson,
      ignoreExistingTopLevelPcbRouteState: true,
    })
  } catch (error) {
    extractionError = error instanceof Error ? error : new Error(String(error))
  }

  expect(extractionError?.message).toContain(
    "Conflicting trace: pcb_trace_altium_arc_4291",
  )

  const svg = createTiSrjReproSvg({
    circuitJson,
    designName: "PMP22650",
    title: "FRESH SRJ CRASHES ON IMPORTED DRAWING ARC",
    viewport: { minX: 205, minY: 42, maxX: 213, maxY: 52 },
    xRayElementIds: ["pcb_trace_altium_arc_4291"],
    status: "fail",
    statusText: "FAIL · imported non-routing copper entered SRJ obstacles",
    details: [
      "actual element: pcb_trace_altium_arc_4291",
      "actual geometry: 49-point Altium circle approximation on top copper",
      "extractor result: rejects the arc's diagonal segments before routing",
    ],
  })

  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
