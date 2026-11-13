import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a string cadModel takes precedence over the footprint's footprinter string", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <chip name="U1" footprint="soic8" cadModel="tssop8" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const cadComponents = circuit.db.cad_component.list()
  expect(cadComponents).toHaveLength(1)
  expect(cadComponents[0]?.footprinter_string).toBe("tssop8")
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(8)
})
