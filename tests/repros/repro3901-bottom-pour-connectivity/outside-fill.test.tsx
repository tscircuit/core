import { expect, test } from "bun:test"
import {
  copperPolygonsTouch,
  getPlatedHolePolygon,
  getPourPolygon,
} from "lib/utils/copper-pour-connectivity/copper-geometry"
import { renderBottomPour } from "./fixture"

test("repro3901: a plated contact outside the bottom pour must remain disconnected", async () => {
  const circuit = await renderBottomPour({ excludeJ2: true })
  const pours = circuit.db.pcb_copper_pour.list()
  const platedHoles = circuit.db.pcb_plated_hole
    .list()
    .sort((a, b) => a.x - b.x)

  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(pours).toHaveLength(1)
  expect(pours[0]).toMatchObject({ shape: "brep", layer: "bottom" })
  expect(platedHoles).toHaveLength(2)

  // Same emitted board-world copper comparison as the connected case.
  const pourPolygon = getPourPolygon(pours[0]!)
  expect(
    copperPolygonsTouch(pourPolygon, getPlatedHolePolygon(platedHoles[0]!)),
  ).toBe(true)
  expect(
    copperPolygonsTouch(pourPolygon, getPlatedHolePolygon(platedHoles[1]!)),
  ).toBe(false)

  // A connectivity fix must not suppress every error just because GND has a
  // pour: J2 has no copper path to J1 or the GND via in this control.
  expect(
    circuit.db.pcb_port_not_connected_error
      .list()
      .map((error) => error.message),
  ).toContain("Port [J2.GND] is not connected to net [GND] by a PCB trace.")

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
