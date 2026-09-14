import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A prop that fails validation stays unvalidated on the ErrorPlaceholder that
// the reconciler substitutes. PrimitiveComponent.getString() runs on that
// placeholder on every phase start and end, so a prop value with no primitive
// conversion (here a null-prototype object) used to throw when interpolated and
// abort the whole render instead of recording the intended error. This covers
// both a coerced `name` (ErrorPlaceholder) and a `from` in a getString branch.
test("repro100: non-primitive prop does not abort render", async () => {
  const { circuit } = getTestFixture()

  const badName: any = Object.create(null)
  const badFrom: any = Object.create(null)

  circuit.add(
    <board width="10mm" height="10mm">
      <group>
        <resistor name={badName} resistance="1k" footprint="0402" />
        <trace from={badFrom} to=".R1 > .pin1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_failed_to_create_component_error")

  expect(errors.length).toBe(2)
  for (const error of errors) {
    expect(error.error_type).toBe("source_failed_to_create_component_error")
    expect(typeof error.message).toBe("string")
  }
})
