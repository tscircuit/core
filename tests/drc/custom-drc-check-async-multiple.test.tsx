import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check supports async functions and multiple diagnostics", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={-3} />
      <chip name="U2" footprint="soic8" pcbX={3} />

      <drccheck
        name="chip-policy"
        checkFn={async ({ selectAll }) => {
          const chips = selectAll("chip")

          return chips.map((chip, index) => ({
            error_type: "source_component_misconfigured_error",
            message: `Custom chip policy violation ${index + 1}`,
            source_component_ids: [
              chip.getSourceComponent()!.source_component_id,
            ],
          }))
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const customErrors = circuit
    .getCircuitJson()
    .filter(
      (elm) =>
        elm.type === "source_component_misconfigured_error" &&
        "message" in elm &&
        elm.message.startsWith("Custom chip policy violation"),
    )

  expect(customErrors).toHaveLength(2)
  expect(
    customErrors
      .map((error) => ("message" in error ? error.message : ""))
      .sort(),
  ).toEqual([
    "Custom chip policy violation 1",
    "Custom chip policy violation 2",
  ])
  expect(
    customErrors.every(
      (error) =>
        "source_component_ids" in error &&
        error.source_component_ids.length === 1,
    ),
  ).toBe(true)
})
