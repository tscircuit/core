import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"

test("rejects length match overlap before routing", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <DifferentialPairValidationBoard>
      <bus
        name="DATA"
        connections={["DM2"]}
        lengthMatchTo="DP1"
        maxLengthSkew={0.2}
      />
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
    </DifferentialPairValidationBoard>,
  )
  expect(() => circuit.render()).toThrow("overlaps differential pair")
})
