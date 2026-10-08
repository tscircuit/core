import { expect, test } from "bun:test"
import { assembly, jscad } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { executeJscadOperations } from "jscad-planner"
import * as modeling from "@jscad/modeling"

test("surface planes and opposite normals place off-axis printed geometry in all six directions", async () => {
  for (const [plane, normalDirection, expected] of [
    ["xy", "positive", [1, 2, 3]],
    ["xy", "negative", [1, -2, -3]],
    ["xz", "positive", [1, 3, -2]],
    ["xz", "negative", [1, -3, 2]],
    ["yz", "positive", [3, 1, 2]],
    ["yz", "negative", [-3, 1, -2]],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.part name="BASE">
          <assembly.referencesurface
            name="face"
            plane={plane}
            normalDirection={normalDirection}
          />
        </assembly.part>
        <assembly.printedpart
          name="PROBE"
          mountedTo="BASE.face"
          mountFace="bottom"
          jscad={<jscad.cuboid size={[1, 1, 1]} center={[1, 2, 3]} />}
        >
          <assembly.referencesurface name="bottom" normalDirection="negative" />
        </assembly.printedpart>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const cad = circuit.db.cad_component.list()[0]
    const geometry = executeJscadOperations(modeling as any, cad.model_jscad)
    const center = modeling.measurements.measureCenter(geometry)
    for (let axis = 0; axis < 3; axis++)
      expect(center[axis]).toBeCloseTo(expected[axis], 5)
  }
})
