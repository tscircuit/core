import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"

test("rejects pn short before routing", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <DifferentialPairValidationBoard>
      <trace from=".ESD > .pin1" to=".ESD > .pin2" />
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
    </DifferentialPairValidationBoard>,
  )
  expect(() => circuit.render()).toThrow("electrically shorted")
})
