import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"
import { VIA_STITCHING_POWER_TRACE_WIDTH_MM } from "./via-stitching-test-circuits"
import type { ViaStitchingPostProcessOutput } from "./via-stitching-post-process-solver"

export const assertViaStitchingOutput = ({
  circuit,
  output,
}: {
  circuit: RootCircuit
  output: ViaStitchingPostProcessOutput
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

  expect(output.transitionCount).toBeGreaterThan(0)
  expect(output.copperPours).toHaveLength(output.transitionCount * 2)
  expect(
    new Set(output.copperPours.map((copperPour) => copperPour.layer)),
  ).toEqual(new Set(["top", "bottom"]))
  expect(
    output.copperPours.every(
      (copperPour) =>
        copperPour.source_net_id !== undefined &&
        powerSourceNetIds.has(copperPour.source_net_id),
    ),
  ).toBe(true)

  expect(output.stitchingVias).toHaveLength(output.transitionCount * 4)
  expect(
    output.stitchingVias.every(
      (stitchingVia) =>
        stitchingVia.layers.join(",") === "top,bottom" &&
        stitchingVia.from_layer === "top" &&
        stitchingVia.to_layer === "bottom" &&
        stitchingVia.source_net_id !== undefined &&
        powerSourceNetIds.has(stitchingVia.source_net_id) &&
        stitchingVia.subcircuit_connectivity_map_key !== undefined,
    ),
  ).toBe(true)
}
