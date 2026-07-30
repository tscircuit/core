import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip auto width includes the longest label on each opposing side", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <chip
      name="U1"
      manufacturerPartNumber="Opposing labels"
      pinLabels={{
        pin1: ["LONG_LEFT_SIDE_LABEL"],
        pin2: ["LONG_RIGHT_SIDE_LABEL"],
      }}
    />,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
