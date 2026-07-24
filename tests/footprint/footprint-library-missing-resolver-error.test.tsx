import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("missing footprint library resolver reports a load error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10}>
      <resistor name="R1" resistance="1k" footprint="missing:R_0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit.db.external_footprint_load_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain(
    'No footprint resolver is configured for library "missing".',
  )
  expect(errors[0].footprinter_string).toBe("missing:R_0402")
})
