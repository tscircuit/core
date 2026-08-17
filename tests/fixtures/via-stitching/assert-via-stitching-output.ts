import { expect } from "bun:test"
import type { ViaStitchSolverOutput } from "@tscircuit/via-stitch-solver"
import type { RootCircuit } from "lib/RootCircuit"
import { VIA_STITCHING_POWER_TRACE_WIDTH_MM } from "./via-stitching-test-circuits"

export const assertViaStitchingOutput = ({
  circuit,
  output,
}: {
  circuit: RootCircuit
  output: ViaStitchSolverOutput
}) => {
  const powerSourceNetIds = new Set(
    circuit.db.source_net
      .list()
      .filter((sourceNet) => sourceNet.is_power)
      .map((sourceNet) => sourceNet.source_net_id),
  )
  const powerSourceTraces = circuit.db.source_trace
    .list()
    .filter((sourceTrace) =>
      sourceTrace.connected_source_net_ids?.some((sourceNetId) =>
        powerSourceNetIds.has(sourceNetId),
      ),
    )
  const powerSourceTraceIds = new Set(
    powerSourceTraces.map((sourceTrace) => sourceTrace.source_trace_id),
  )
  const routedPowerTraces = circuit.db.pcb_trace
    .list()
    .filter(
      (pcbTrace) =>
        pcbTrace.source_trace_id !== undefined &&
        powerSourceTraceIds.has(pcbTrace.source_trace_id),
    )
  const routedPowerWirePoints = routedPowerTraces.flatMap((pcbTrace) =>
    pcbTrace.route.filter((routePoint) => routePoint.route_type === "wire"),
  )

  expect(powerSourceTraces.length).toBeGreaterThan(0)
  expect(
    powerSourceTraces.every(
      (sourceTrace) =>
        sourceTrace.min_trace_thickness === VIA_STITCHING_POWER_TRACE_WIDTH_MM,
    ),
  ).toBe(true)
  expect(routedPowerTraces.length).toBeGreaterThan(0)
  expect(routedPowerWirePoints.length).toBeGreaterThan(0)
  expect(
    routedPowerTraces.every((pcbTrace) =>
      pcbTrace.route.some(
        (routePoint) =>
          routePoint.route_type === "wire" &&
          routePoint.width >= VIA_STITCHING_POWER_TRACE_WIDTH_MM,
      ),
    ),
  ).toBe(true)

  const existingTransitionPoints = routedPowerTraces.flatMap((pcbTrace) =>
    pcbTrace.route
      .filter((routePoint) => routePoint.route_type === "via")
      .map((routePoint) => ({ x: routePoint.x, y: routePoint.y })),
  )

  expect(output.processedPowerTraceCount).toBeGreaterThan(0)
  expect(output.detectedLayerTransitionCount).toBeGreaterThan(0)
  expect(output.pcbCopperPours.length).toBeGreaterThanOrEqual(
    output.processedPowerTraceCount * 2,
  )
  expect(
    new Set(output.pcbCopperPours.map((copperPour) => copperPour.layer)),
  ).toEqual(new Set(["top", "bottom"]))
  expect(
    output.pcbCopperPours.every(
      (copperPour) =>
        copperPour.source_net_id !== undefined &&
        powerSourceNetIds.has(copperPour.source_net_id) &&
        copperPour.covered_with_solder_mask,
    ),
  ).toBe(true)

  expect(output.pcbVias.length).toBeGreaterThan(
    output.detectedLayerTransitionCount,
  )
  expect(
    output.pcbVias.every(
      (stitchingVia) =>
        stitchingVia.layers.join(",") === "top,bottom" &&
        stitchingVia.from_layer === "top" &&
        stitchingVia.to_layer === "bottom" &&
        stitchingVia.source_net_id !== undefined &&
        powerSourceNetIds.has(stitchingVia.source_net_id) &&
        stitchingVia.subcircuit_connectivity_map_key !== undefined,
    ),
  ).toBe(true)
  expect(
    output.pcbVias.some((stitchingVia) =>
      existingTransitionPoints.every(
        (transitionPoint) =>
          Math.hypot(
            stitchingVia.x - transitionPoint.x,
            stitchingVia.y - transitionPoint.y,
          ) >= 1,
      ),
    ),
  ).toBe(true)
}
