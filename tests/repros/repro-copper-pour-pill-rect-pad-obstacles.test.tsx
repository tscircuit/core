import { expect, test } from "bun:test"
import type { InputProblem } from "@tscircuit/copper-pour-solver"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: copper pour omits pill holes with rectangular pads", async () => {
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
        text="Bug: both pill pads are missing from pour obstacles"
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

  // Record the bug: both pill shapes exist in Circuit JSON, but only the
  // circular-hole control reaches the solver. A fix must update these expectations.
  expect(solverInput?.pads.map((pad) => pad.padId)).toEqual([
    holes[0]!.pcb_plated_hole_id,
  ])

  const pours = circuit.db.pcb_copper_pour.list()
  expect(pours).toHaveLength(1)
  const [pour] = pours
  if (pour?.shape !== "brep") throw new Error("Expected a BRep copper pour")
  const voids = pour.brep_shape.inner_rings
  expect(voids).toHaveLength(1)

  // Emitted points are in board/circuit world space, mm, +X right, +Y up.
  // The only void surrounds the control's 3 x 2 mm pad with 0.5 mm clearance.
  const vertices = voids[0]!.vertices
  expect({
    minX: Math.min(...vertices.map((point) => point.x)),
    maxX: Math.max(...vertices.map((point) => point.x)),
    minY: Math.min(...vertices.map((point) => point.y)),
    maxY: Math.max(...vertices.map((point) => point.y)),
  }).toEqual({ minX: -9, maxX: -5, minY: -1.5, maxY: 1.5 })
})
