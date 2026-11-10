import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"

test("rejects duplicate hop before routing", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <DifferentialPairValidationBoard>
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP1"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
    </DifferentialPairValidationBoard>,
  )
  expect(() => circuit.render()).toThrow("invalid source_bus")
})
