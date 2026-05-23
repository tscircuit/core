import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pinheader female gender changes the implied CAD footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="J1" pinCount={4} gender="female" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cadComponent = circuit.db.cad_component.list()[0]
  expect(cadComponent).toBeDefined()
  expect(cadComponent?.footprinter_string).toContain("_female")
})
