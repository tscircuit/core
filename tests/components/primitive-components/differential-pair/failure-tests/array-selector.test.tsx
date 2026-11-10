import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"

test("reports invalid array selector props as a source creation error", () => {
  const { circuit } = getTestFixture()
  const pair = (
    <differentialpair
      name="USB"
      positiveConnection={[".J1 > .pin1"]}
      negativeConnection="DM1"
      maxLengthSkew={0.1}
    />
  )
  circuit.add(
    <DifferentialPairValidationBoard>{pair}</DifferentialPairValidationBoard>,
  )
  circuit.render()
  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]!.message).toContain("trace names only")
  expect(circuit.db.source_bus.list()).toEqual([])
})
