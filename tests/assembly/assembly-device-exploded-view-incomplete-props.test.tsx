import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exploded-view direction and distance must be provided together", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="Device">
      <group subcircuit>
        <chip
          name="LID"
          footprint={<footprint />}
          cadModel={{ jscad: { type: "cuboid", size: [20, 20, 2] } }}
          explodeDirection="above"
        />
      </group>
    </assembly.device>,
  )

  expect(() => circuit.render()).toThrow(
    'Assembly part "LID" must provide explodeDirection and explodeDistance together',
  )
})
