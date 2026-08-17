import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"

export const assertViaStitchingOutput = ({
  circuit,
}: {
  circuit: RootCircuit
}) => {
  const groundSourceNet = circuit.db.source_net
    .list()
    .find((sourceNet) => sourceNet.is_ground)
  expect(groundSourceNet).toBeDefined()

  const groundCopperPours = circuit.db.pcb_copper_pour
    .list()
    .filter(
      (copperPour) =>
        copperPour.source_net_id === groundSourceNet!.source_net_id,
    )
  expect(
    new Set(groundCopperPours.map((copperPour) => copperPour.layer)),
  ).toEqual(new Set(["top", "bottom"]))

  const groundStitchingVias = circuit.db.pcb_via
    .list()
    .filter((pcbVia) => pcbVia.source_net_id === groundSourceNet!.source_net_id)
  expect(groundStitchingVias.length).toBeGreaterThan(10)
  expect(
    groundStitchingVias.every(
      (pcbVia) =>
        pcbVia.from_layer === "top" &&
        pcbVia.to_layer === "bottom" &&
        pcbVia.layers.join(",") === "top,bottom" &&
        pcbVia.is_tented === true,
    ),
  ).toBe(true)
  expect(
    groundStitchingVias.every(
      (pcbVia) =>
        Number.isInteger(pcbVia.x / 2) && Number.isInteger(pcbVia.y / 2),
    ),
  ).toBe(true)
}
