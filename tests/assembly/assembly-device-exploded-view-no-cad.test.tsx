import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exploded-view props require CAD geometry in the configured subtree", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="Device">
      <group
        name="EMPTY_PART"
        subcircuit
        explodeDirection="above"
        explodeDistance="10mm"
      />
    </assembly.device>,
  )

  expect(() => circuit.render()).toThrow(
    'Assembly part "EMPTY_PART" has exploded-view props but no CAD geometry',
  )
})
