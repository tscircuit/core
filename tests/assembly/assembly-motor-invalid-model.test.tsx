import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("assembly.motor accepts only NEMA modelprinter specs", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.motor name="MOTOR" model="soic8" />
    </assembly.device>,
  )
  expect(() => circuit.render()).toThrow(/requires a NEMA modelprinter model/)
})
