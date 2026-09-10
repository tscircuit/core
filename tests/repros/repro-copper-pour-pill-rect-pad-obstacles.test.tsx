import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/copper-pour-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: copper pour clears pill holes with rectangular pads", async () => {
  const { circuit } = getTestFixture()
  let solverInput: InputProblem | undefined
  circuit.on("solver:started", (event) => {
    if (event.solverName === "CopperPourPipelineSolver") {
      solverInput = event.solverParams as InputProblem
    }
  })

  circuit.add(
    <board width="24mm" height="12mm" routingDisabled>
      <net name="GND" isGroundNet />
      <net name="SIGNAL" />
      <chip
        name="J1"
        connections={{
          pin1: "net.SIGNAL",
          pin2: "net.SIGNAL",
          pin3: "net.SIGNAL",
        }}
        footprint={
          <footprint>
            <platedhole
              shape="circular_hole_with_rect_pad"
              holeDiameter={1}
              rectPadWidth={3}
              rectPadHeight={2}
              pcbX={-7}
              portHints={["pin1"]}
            />
            <platedhole
              shape="pill_hole_with_rect_pad"
              holeWidth={2}
              holeHeight={1}
              rectPadWidth={3}
              rectPadHeight={2}
              portHints={["pin2"]}
            />
            <platedhole
              shape="pill_hole_with_rect_pad"
              holeWidth={2}
              holeHeight={1}
              rectPadWidth={3}
              rectPadHeight={2}
              pcbRotation={45}
              pcbX={7}
              portHints={["pin3"]}
            />
          </footprint>
        }
      />
      <copperpour connectsTo="net.GND" layer="top" padMargin="0.5mm" />
      <pcbnotetext text="GND POUR / SIGNAL PADS" pcbY={4.5} fontSize={0.7} />
      <pcbnotetext
        text="CIRCULAR CONTROL"
        pcbX={-7}
        pcbY={2.8}
        fontSize={0.5}
      />
      <pcbnotetext text="PILL / RECT" pcbY={2.8} fontSize={0.5} />
      <pcbnotetext
        text="PILL / RECT 45deg"
        pcbX={7}
        pcbY={2.8}
        fontSize={0.5}
      />
      <pcbnotetext
        text="Expected: 0.5 mm clearance around all three pads"
        pcbY={-3.5}
        fontSize={0.5}
      />
      <pcbnotetext
        text="Both pill pads must appear as pour obstacles"
        pcbY={-4.5}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, { layer: "top" })

  const holes = circuit.db.pcb_plated_hole.list()
  expect(holes.map((hole) => hole.shape)).toEqual([
    "circular_hole_with_rect_pad",
    "pill_hole_with_rect_pad",
    "rotated_pill_hole_with_rect_pad",
  ])

  // All three plated pads must reach the solver, including both pill variants.
  expect(solverInput?.pads.map((pad) => pad.padId)).toEqual(
    holes.map((hole) => hole.pcb_plated_hole_id),
  )

  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(1)
  const [pour] = pours
  if (pour?.shape !== "brep") throw new Error("Expected a BRep copper pour")
  const voids = pour.brep_shape.inner_rings
  expect(voids).toHaveLength(3)

  // Emitted points are in board/circuit world space, mm, +X right, +Y up.
  // Each 3 x 2 mm pad receives 0.5 mm clearance on all sides. The rotated
  // pad's clearance rectangle is 4 x 3 mm, rotated 45 degrees with mitered corners.
  const voidBounds = voids
    .map(({ vertices }) => ({
      minX: Math.min(...vertices.map((point) => point.x)),
      maxX: Math.max(...vertices.map((point) => point.x)),
      minY: Math.min(...vertices.map((point) => point.y)),
      maxY: Math.max(...vertices.map((point) => point.y)),
    }))
    .sort((a, b) => a.minX - b.minX)
  expect(voidBounds.slice(0, 2)).toEqual([
    { minX: -9, maxX: -5, minY: -1.5, maxY: 1.5 },
    { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 },
  ])
  const rotatedHalfExtent = 3.5 / Math.SQRT2
  expect(voidBounds[2]!.minX).toBeCloseTo(7 - rotatedHalfExtent, 5)
  expect(voidBounds[2]!.maxX).toBeCloseTo(7 + rotatedHalfExtent, 5)
  expect(voidBounds[2]!.minY).toBeCloseTo(-rotatedHalfExtent, 5)
  expect(voidBounds[2]!.maxY).toBeCloseTo(rotatedHalfExtent, 5)
})
