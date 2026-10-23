import { expect, test } from "bun:test"
import type { Point3 } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import {
  GimbalOneWaypoints,
  gimbalCableWaypoints,
  gimbalMotorPigtails,
} from "./fixtures/gimbal-one-waypoints"

/** Slab intersection in circuit-world mm (+X right, +Y top, +Z above).
 * The actual phone reference is 160 x 78 x 9 mm, centered at (0, 0, 21.5).
 * Inflate it by 2.6 mm: PH3 conductor half-span 2 mm + wire radius 0.6 mm.
 */
function segmentEntersPhone(from: Point3, to: Point3) {
  const bounds = {
    x: [-82.6, 82.6],
    y: [-41.6, 41.6],
    z: [14.4, 28.6],
  } as const
  let enter = 0
  let exit = 1
  for (const axis of ["x", "y", "z"] as const) {
    const delta = to[axis] - from[axis]
    const [min, max] = bounds[axis]
    if (Math.abs(delta) < 1e-9) {
      if (from[axis] < min || from[axis] > max) return false
      continue
    }
    const tMin = (min - from[axis]) / delta
    const tMax = (max - from[axis]) / delta
    enter = Math.max(enter, Math.min(tMin, tMax))
    exit = Math.min(exit, Math.max(tMin, tMax))
    if (enter > exit) return false
  }
  return true
}

test("Gimbal One motor harness waypoints route around the phone holder", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<GimbalOneWaypoints />)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_board.list()).toHaveLength(1)
  expect(circuit.db.pcb_hole.list()).toHaveLength(4)
  expect(circuit.db.cad_cable.list()).toHaveLength(3)

  for (const { axis, motor, connectorX, wireExit } of gimbalMotorPigtails) {
    const cable = circuit.db.cad_cable
      .list()
      .find((cable) => cable.name === `HARNESS_${axis}`)!
    const from = circuit.db.source_component.get(cable.from_source_component_id)
    const to = circuit.db.source_component.get(cable.to_source_component_id)
    expect(from?.name).toBe(`J_${axis}`)
    expect(to?.name).toBe(motor)
    expect(cable.path.slice(2, -2)).toEqual(gimbalCableWaypoints[axis])
    expect(cable.path[0]!.x).toBeCloseTo(connectorX)
    expect(cable.path[0]!.y).toBeCloseTo(29)
    expect(cable.path[0]!.z).toBeCloseTo(13.65)
    const last = cable.path.at(-1)!
    expect(last.x).toBeCloseTo(wireExit.x)
    expect(last.y).toBeCloseTo(wireExit.y)
    expect(last.z).toBeCloseTo(wireExit.z)
    for (let index = 1; index < cable.path.length; index++) {
      expect(
        segmentEntersPhone(cable.path[index - 1]!, cable.path[index]!),
        `${cable.name} segment ${index} enters the phone clearance envelope`,
      ).toBe(false)
    }
  }

  const { circuit: inferred } = getTestFixture()
  inferred.add(<GimbalOneWaypoints routed={false} />)
  await inferred.renderUntilSettled()
  expect(
    inferred.db.cad_cable
      .list()
      .some((cable) =>
        cable.path
          .slice(1)
          .some((point, index) =>
            segmentEntersPhone(cable.path[index]!, point),
          ),
      ),
  ).toBe(true)

  // The gimbal's authored upright is circuit +Y. The converter's final glTF
  // frame is (-X, Z, Y), so camera up="z+" keeps its stand below the holder.
  await expectAssemblySnapshot(import.meta.path, {
    title: "Gimbal One / route three motor harnesses around the holder",
    font: "alphabet",
    panels: [
      {
        title: "Actual black gimbal, motor screws and folding stand",
        code: `<GimbalOneWaypoints />

// One 84 x 70 mm PCB.
// All 221 actual rigid meshes:
// screw clamp, three 2805 motors,
// adapters, screws, folding stand.

// Three native assembly.cables.
// Imported motors have proposed
// detachable PH3 pigtail surfaces;
// no NEMA stand-ins or extra PCBs.`,
        annotation:
          "Original meshes / native cables / proposed PH3 terminations / neutral pose only",
        circuit,
        renderOptions: {
          poppygl: {
            camPos: [-430, 420, 220],
            lookAt: [-10, -15, -105],
            up: "z+",
            fov: 40,
          },
        },
      },
      {
        title: "Waypoints guide the wires outside the holder",
        code: `<assembly.cable
  name="HARNESS_PITCH"
  from=".CONTROLLER > .J_PITCH"
  to="REF_Pitch_2805.pigtail"
  model="jst_ph_pins3"
  waypoints={[
    { x: -26, y: 19, z: 13.2 },
    { x: -78, y: 19, z: 13.2 },
    { x: -78, y: 19, z: -45 },
    // Continue outside the cradle
    // and loop back to the motor.
  ]}
/>`,
        annotation:
          "Every emitted segment clears the phone envelope, including a 2.6 mm bundle allowance",
        circuit,
        renderOptions: {
          poppygl: {
            camPos: [-230, 185, 160],
            lookAt: [-5, -25, -25],
            up: "z+",
            fov: 45,
          },
        },
      },
      {
        title: "Without waypoints the inferred path crosses the phone",
        code: `<assembly.cable
  name="HARNESS_PITCH"
  from=".CONTROLLER > .J_PITCH"
  to="REF_Pitch_2805.pigtail"
  model="jst_ph_pins3"
/>

// Automatic routing does not
// know the holder is an obstacle.
// Explicit points control where
// the route must pass.`,
        annotation:
          "Same endpoints, same mechanical assembly, no manually chosen route",
        circuit: inferred,
        renderOptions: {
          poppygl: {
            camPos: [-230, 185, 160],
            lookAt: [-5, -25, -25],
            up: "z+",
            fov: 45,
          },
        },
      },
    ],
  })
}, 15_000)
