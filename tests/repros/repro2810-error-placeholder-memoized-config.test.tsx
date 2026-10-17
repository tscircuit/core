import { expect, test } from "bun:test"
import { createErrorPlaceholderComponent } from "lib/components/primitive-components/ErrorPlaceholder"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ErrorPlaceholder reuses a memoized Zod schema config across accesses and instances", async () => {
  const placeholderA = createErrorPlaceholderComponent(
    { name: "R_BAD_1", componentType: "resistor", pcbX: 1, pcbY: 2 },
    new Error("Invalid resistance"),
  )
  const placeholderB = createErrorPlaceholderComponent(
    { name: "R_BAD_2", componentType: "resistor", pcbX: 3, pcbY: 4 },
    new Error("Invalid resistance"),
  )

  expect(placeholderA.config).toBe(placeholderA.config)
  expect(placeholderA.config.zodProps).toBe(placeholderB.config.zodProps)
  expect(placeholderA.componentName).toBe("ErrorPlaceholder")

  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      {/* @ts-expect-error intentionally omitting required resistance prop */}
      <resistor name="R_BAD" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.source_failed_to_create_component_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]?.component_name).toBe("R_BAD")
})
