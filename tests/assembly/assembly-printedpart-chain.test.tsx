import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import modeling from "@jscad/modeling"
import { executeJscadOperations, type JscadOperation } from "jscad-planner"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { MotorSpacer } from "./fixtures/motor-spacer"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("printed parts follow offset and rotated named faces through forward-reference chains", async () => {
  const { circuit } = getTestFixture()
  const Stand = () => (
    <>
      <jscad.cuboid size={[42, 42, 4]} center={[12, 3, 2]} />
      <jscad.translate offset={[12, 3, 4]}>
        <jscad.rotate angles={[0, 0, Math.PI / 2]}>
          <jscad.rectangle name="top" reference size={[42, 42]} />
        </jscad.rotate>
      </jscad.translate>
    </>
  )
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="SECOND"
        jscad={<MotorSpacer height={10} />}
        mountedTo="FIRST.board"
        mountFace="motor"
        mountGap="2mm"
      />
      <assembly.printedpart
        name="FIRST"
        jscad={<MotorSpacer height={10} />}
        mountedTo="STAND.top"
        mountFace="motor"
      />
      <assembly.printedpart name="STAND" jscad={<Stand />} />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  for (const [name, minZ, maxZ] of [
    ["STAND", 0, 4],
    ["FIRST", 4, 14],
    ["SECOND", 16, 26],
  ] as const) {
    const source = circuit.db.source_component
      .list()
      .find((source) => source.name === name)!
    const cad = circuit.db.cad_component
      .list()
      .find((cad) => cad.source_component_id === source.source_component_id)!
    const solid = modeling.transforms.translate(
      [cad.position.x, cad.position.y, cad.position.z],
      executeJscadOperations(
        modeling as any,
        cad.model_jscad as JscadOperation,
      ),
    )
    const [min, max] = modeling.measurements.measureBoundingBox(solid)
    expect(min[2]).toBeCloseTo(minZ, 5)
    expect(max[2]).toBeCloseTo(maxZ, 5)
    expect((min[0] + max[0]) / 2).toBeCloseTo(12, 5)
    expect((min[1] + max[1]) / 2).toBeCloseTo(3, 5)
  }
  const standSource = circuit.db.source_component
    .list()
    .find((s) => s.name === "STAND")!
  const standSurface = circuit.db.cad_reference_surface
    .list()
    .find((s) => s.source_component_id === standSource.source_component_id)!
  expect(standSurface).toMatchObject({
    name: "top",
    center: { x: 12, y: 3, z: 4 },
    normal: { x: 0, y: 0, z: 1 },
  })
  expect(standSurface.x_axis.x).toBeCloseTo(0)
  expect(standSurface.x_axis.y).toBeCloseTo(1)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Named faces follow authored offsets and rotations",
    panels: [
      {
        title: "Two spacers on a stand / forward references",
        code: `<jscad.translate offset={[12,3,4]}>
  <jscad.rotate angles={[0,0,Math.PI/2]}>
    <jscad.rectangle name="top"
      reference size={[42,42]} />
  </jscad.rotate>
</jscad.translate>

<assembly.printedpart name="FIRST"
  mountedTo="STAND.top" mountFace="motor"
  jscad={<MotorSpacer />} />
<assembly.printedpart name="SECOND"
  mountedTo="FIRST.board" mountFace="motor"
  mountGap="2mm" jscad={<MotorSpacer />} />`,
        annotation:
          "Stand Z=0–4 / first spacer Z=4–14 / second spacer Z=16–26 / all centers X=12, Y=3 mm",
        circuit,
      },
    ],
  })
})
