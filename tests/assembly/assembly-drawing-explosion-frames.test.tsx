import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("qualified explosion stage drawings preserve mounted owner frames and measure the displayed pose", async () => {
  const { circuit } = getTestFixture()
  const normals = ["z+", "z-", "y+", "y-"] as const
  circuit.add(
    <assembly.device name="ROOT">
      {normals.map((normal, i) => (
        <assembly.device key={normal} name={`D${i}`}>
          <assembly.part
            name="BASE"
            cadModel={{ jscad: { type: "cuboid", size: [10, 8, 2] } }}
          >
            <assembly.referencesurface
              name="face"
              plane={normal[0] === "z" ? "xy" : "xz"}
              normalDirection={normal}
            />
          </assembly.part>
          <assembly.printedpart
            name="CARRIER"
            mountedTo="BASE.face"
            mountFace="back"
            jscad={<jscad.cube size={2} />}
          >
            <assembly.referencesurface name="back" normalDirection="z-" />
            <assembly.subassembly name="MODULE">
              <assembly.part
                name="FIXED"
                cadModel={{ jscad: { type: "cuboid", size: [8, 6, 2] } }}
              />
              <assembly.part
                name="MARKER"
                cadModel={{
                  jscad: { type: "cuboid", size: [3, 2, 4], center: [0, 0, 5] },
                }}
              />
              <assembly.explosion.stage name="move">
                <assembly.explosion.move
                  targetRefs="MARKER"
                  offX={5}
                  offY={7}
                  offZ={11}
                />
              </assembly.explosion.stage>
            </assembly.subassembly>
          </assembly.printedpart>
        </assembly.device>
      ))}
      <assembly.drawing.page
        width={300}
        height={200}
        anchorAlignment="bottom_left"
      >
        <assembly.drawing.titleblock title="QUALIFIED STAGES - MOUNTED OWNER FRAMES" />
        {normals.map((normal, i) => (
          <assembly.drawing.explosionview
            key={normal}
            name={`frame${i}`}
            displayName={`MOUNT NORMAL ${normal}`}
            stageRef={`D${i}.CARRIER.MODULE.move`}
            direction="isometric"
            width={65}
            height={90}
            centerX={40 + i * 73}
            centerY={120}
            showTrails
          >
            <assembly.drawing.dimension widthOfView />
            <assembly.drawing.dimension heightOfView />
          </assembly.drawing.explosionview>
        ))}
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const views = circuit.db.drawing_explosion_view.list()
  expect(views).toHaveLength(4)
  const displacementVectors = []
  for (const [i, view] of views.entries()) {
    const stage = circuit.db.cad_explosion_stage
      .list()
      .find((stage) => stage.name === `ROOT.D${i}.CARRIER.MODULE.move`)!
    const move = circuit.db.cad_explosion_move
      .list()
      .find(
        (move) => move.cad_explosion_stage_id === stage.cad_explosion_stage_id,
      )!
    const moved = view.moves.filter(
      (move) =>
        Math.hypot(move.translation.x, move.translation.y, move.translation.z) >
        0,
    )
    expect(moved).toHaveLength(1)
    for (const axis of ["x", "y", "z"] as const)
      expect(moved[0].translation[axis]).toBeCloseTo(move.translation[axis], 5)
    expect(view.moves).toHaveLength(2)
    displacementVectors.push(moved[0].translation)
    expect(
      circuit.db.drawing_dimension_line
        .list()
        .filter(
          (line) =>
            line.drawing_explosion_view_id === view.drawing_explosion_view_id,
        ),
    ).toHaveLength(2)
  }
  // The same authored vector has four distinct world-space results.
  expect(
    new Set(displacementVectors.map((vector) => JSON.stringify(vector))).size,
  ).toBe(4)
  const before = structuredClone(circuit.getCircuitJson())
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
  expect(circuit.getCircuitJson()).toEqual(before)
})
