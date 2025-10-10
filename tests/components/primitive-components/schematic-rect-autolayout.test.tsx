import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("SchematicRect symbol of chip with autolayout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect width={2} height={2} isFilled={false} />
          </symbol>
        }
      />
      <chip
        name="U2"
        symbol={
          <symbol>
            <schematicrect width={2} height={2} isFilled={false} />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
