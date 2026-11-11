import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"

test("rejects selectors inside a connection list", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <DifferentialPairValidationBoard>
      <differentialpair
        name="USB"
        positiveConnection={[".J1 > .pin1"]}
        negativeConnection="DM1"
        maxLengthSkew={0.1}
      />
    </DifferentialPairValidationBoard>,
  )
  expect(() => circuit.render()).toThrow(
    "arrays must contain trace names only, not selectors",
  )
})
