import { expect, test } from "bun:test"
import {
  copperPolygonsTouch,
  getPlatedHolePolygon,
  getPourPolygon,
} from "lib/utils/copper-pour-connectivity/copper-geometry"
import { renderBottomPour } from "./fixture"

test("repro3901: plated contacts joined by a bottom pour get false disconnections", async () => {
  const circuit = await renderBottomPour()
  const groundNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "GND")!
  const pours = circuit.db.pcb_copper_pour.list()
  const platedHoles = circuit.db.pcb_plated_hole.list()

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(pours).toHaveLength(1)
  expect(pours[0]).toMatchObject({
    shape: "brep",
    layer: "bottom",
    source_net_id: groundNet.source_net_id,
  })
  expect(platedHoles).toHaveLength(2)

  // Compare emitted copper in board-world mm (+X right, +Y up), accounting
  // for the pour's inner rings and each plated pad's drill hole.
  const pourPolygon = getPourPolygon(pours[0]!)
  for (const platedHole of platedHoles) {
    expect(platedHole.layers).toEqual(expect.arrayContaining(["top", "bottom"]))
    expect(
      copperPolygonsTouch(pourPolygon, getPlatedHolePolygon(platedHole)),
    ).toBe(true)
  }

  // Current buggy baseline from https://github.com/tscircuit/core/issues/3901.
  // A fix should change this to [] while preserving the geometry assertions.
  // The issue's separate via-courtyard diagnostic is outside this test's scope.
  expect(
    circuit.db.pcb_port_not_connected_error
      .list()
      .map((error) => error.message)
      .sort(),
  ).toEqual([
    "Port [J1.GND] is not connected to net [GND] by a PCB trace.",
    "Port [J2.GND] is not connected to net [GND] by a PCB trace.",
  ])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
