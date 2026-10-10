import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parent and child exploded-view props cannot move the same CAD geometry", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="Device">
      <group
        name="ENCLOSURE"
        subcircuit
        explodeDirection="above"
        explodeDistance="20mm"
      >
        <chip
          name="LID"
          footprint={<footprint />}
          cadModel={{ jscad: { type: "cuboid", size: [20, 20, 2] } }}
          explodeDirection="above"
          explodeDistance="10mm"
        />
      </group>
    </assembly.device>,
  )

  expect(() => circuit.render()).toThrow(
    'Assembly parts "ENCLOSURE" and "LID" assign exploded-view travel to the same CAD geometry',
  )
})
