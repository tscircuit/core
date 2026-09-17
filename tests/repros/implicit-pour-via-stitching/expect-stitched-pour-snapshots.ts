import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"

export const expectStitchedPourSnapshots = async (
  circuit: RootCircuit,
  snapshotPath: string,
) => {
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours.length).toBeGreaterThan(0)
  expect(pours.every((pour) => pour.shape === "brep")).toBe(true)
  expect(new Set(pours.map((pour) => pour.layer))).toEqual(
    new Set(["top", "bottom"]),
  )

  // Check surviving stitching vias, not the autorouter's layer-change vias.
  const board = circuit._getBoard()!
  const stitchingVias = circuit.db.pcb_via
    .list()
    .filter((via) => board._generatedStitchingViaIds!.has(via.pcb_via_id))
  expect(stitchingVias.length).toBeGreaterThan(0)
  const pouredNetIds = new Set(pours.map((pour) => pour.source_net_id))
  expect(
    stitchingVias.every((via) => pouredNetIds.has(via.source_net_id)),
  ).toBe(true)
  expect(
    stitchingVias.every(
      (via) => via.layers.includes("top") && via.layers.includes("bottom"),
    ),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(
    snapshotPath.replace(/\.test\.tsx$/, "-top.test.tsx"),
    { layer: "top" },
  )
  await expect(circuit).toMatchPcbSnapshot(
    snapshotPath.replace(/\.test\.tsx$/, "-bottom.test.tsx"),
    { layer: "bottom" },
  )
  await expect(circuit).toMatchPcbSnapshot(snapshotPath)
}
