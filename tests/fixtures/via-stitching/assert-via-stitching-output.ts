import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"
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
