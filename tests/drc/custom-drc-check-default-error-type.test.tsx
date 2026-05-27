import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom drc check defaults missing error_type to source_component_misconfigured_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" routingDisabled>
      <chip name="U1" footprint="soic8" />

      <drccheck
        name="default-error-type-check"
        checkFn={({ selectAll }) => {
          const [chip] = selectAll("chip")
          if (!chip) return

          return {
            message: "Custom DRC defaulted the error type",
            source_component_ids: [
              chip.getSourceComponent()!.source_component_id,
            ],
          }
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
        elm.message === "Custom DRC defaulted the error type",
    )

  expect(customErrors).toHaveLength(1)
  expect(customErrors[0]).toMatchObject({
    error_type: "source_component_misconfigured_error",
  })
})
