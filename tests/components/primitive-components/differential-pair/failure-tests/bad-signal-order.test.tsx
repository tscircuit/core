import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"

test("rejects bad signal order before routing", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <DifferentialPairValidationBoard>
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DM2"]}
        negativeConnection="DM1"
        maxLengthSkew={0.1}
      />
    </DifferentialPairValidationBoard>,
  )
  expect(() => circuit.render()).toThrow("consistent signal order")
})
