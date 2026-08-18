import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"

const getDistanceFromPointToRotatedRect = ({
  point,
  center,
  width,
  height,
  ccwRotation,
}: {
  point: { x: number; y: number }
  center: { x: number; y: number }
  width: number
  height: number
  ccwRotation: number
}) => {
  const rotationRadians = (-ccwRotation * Math.PI) / 180
  const deltaX = point.x - center.x
  const deltaY = point.y - center.y
  const localX =
    deltaX * Math.cos(rotationRadians) - deltaY * Math.sin(rotationRadians)
  const localY =
    deltaX * Math.sin(rotationRadians) + deltaY * Math.cos(rotationRadians)
  return Math.hypot(
    Math.max(Math.abs(localX) - width / 2, 0),
    Math.max(Math.abs(localY) - height / 2, 0),
  )
}

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

  const obstacleClearance = 0.2
  const obstructingComponents = circuit.db.pcb_component
    .list()
    .filter(
      (pcbComponent) =>
        !pcbComponent.do_not_place && pcbComponent.obstructs_within_bounds,
    )
  const rectangularSmtPads = circuit.db.pcb_smtpad
    .list()
    .filter(
      (smtPad) => smtPad.shape === "rect" || smtPad.shape === "rotated_rect",
    )
  expect(
    groundStitchingVias.every((pcbVia) => {
      const requiredClearance = pcbVia.outer_diameter / 2 + obstacleClearance
      const clearsComponents = obstructingComponents.every(
        (pcbComponent) =>
          getDistanceFromPointToRotatedRect({
            point: pcbVia,
            center: pcbComponent.center,
            width: pcbComponent.width,
            height: pcbComponent.height,
            ccwRotation: pcbComponent.rotation,
          }) >= requiredClearance,
      )
      const clearsSmtPads = rectangularSmtPads.every((smtPad) =>
        smtPad.shape === "rect" || smtPad.shape === "rotated_rect"
          ? getDistanceFromPointToRotatedRect({
              point: pcbVia,
              center: smtPad,
              width: smtPad.width,
              height: smtPad.height,
              ccwRotation:
                smtPad.shape === "rotated_rect" ? smtPad.ccw_rotation : 0,
            }) >= requiredClearance
          : true,
      )
      return clearsComponents && clearsSmtPads
    }),
  ).toBe(true)
}
