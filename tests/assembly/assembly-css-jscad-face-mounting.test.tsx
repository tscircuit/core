import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import modeling from "@jscad/modeling"
import { executeJscadOperations, type JscadOperation } from "jscad-planner"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("CSS selectors address generated JSCAD datums and offsets follow rotated face tangents", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.printedpart
        name="CLAMP"
        mountedTo="[name='STAND'] > [name='top']"
        mountFace=".base"
        mountOffset={{ x: 4, y: -2 }}
        mountGap={3}
        jscad={
          <>
            <jscad.cuboid size={[2, 2, 2]} center={[2, 0, 1]} />
            <jscad.rotate angles={[Math.PI, 0, 0]}>
              <jscad.rectangle name="base" reference size={[2, 2]} />
            </jscad.rotate>
          </>
        }
      />
      <assembly.printedpart
        name="STAND"
        jscad={
          <>
            <jscad.cuboid size={[24, 24, 2]} center={[10, 20, 11]} />
            <jscad.translate offset={[10, 20, 12]}>
              <jscad.rotate angles={[0, 0, Math.PI / 2]}>
                <jscad.rectangle name="top" reference size={[24, 24]} />
              </jscad.rotate>
            </jscad.translate>
          </>
        }
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const source = circuit.db.source_component
    .list()
    .find((p) => p.name === "CLAMP")!
  const cad = circuit.db.cad_component
    .list()
    .find((p) => p.source_component_id === source.source_component_id)!
  expect(cad.position.x).toBeCloseTo(12)
  expect(cad.position.y).toBeCloseTo(24)
  expect(cad.position.z).toBeCloseTo(15)
  const solid = modeling.transforms.translate(
    [cad.position.x, cad.position.y, cad.position.z],
    executeJscadOperations(modeling as any, cad.model_jscad as JscadOperation),
  )
  const [min, max] = modeling.measurements.measureBoundingBox(solid)
  for (const [i, value] of [12, 26, 16].entries())
    expect((min[i] + max[i]) / 2).toBeCloseTo(value)
  await expectAssemblySnapshot(import.meta.path, {
    title: "Generated named faces support CSS references",
    panels: [
      {
        title: "Offset along a rotated target plane",
        code: 'mountedTo="[name=STAND] > [name=top]"\nmountFace=".base"\nmountOffset={{x:4,y:-2}} mountGap={3}',
        annotation:
          "90 degree target face: local X offset moves world Y; local Y offset moves world -X.",
        circuit,
        showReferenceSurfaces: true,
      },
    ],
  })
})
