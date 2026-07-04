import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro142: manufacturer part number overflow", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="CHIP1"
        manufacturerPartNumber="SOMETHING_THAT_IS_TOO_LONG"
        pinLabels={{
          pin1: "P1",
          pin2: "P2",
          pin3: "P3",
          pin4: "P4",
        }}
        connections={{
          pin3: "net.GND",
          pin4: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
