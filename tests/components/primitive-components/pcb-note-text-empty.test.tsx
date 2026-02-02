import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnotetext with empty text should create a source_missing_property_error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotetext pcbX={2} pcbY={3} text="" fontSize={1.5} />
    </board>,
  )

  circuit.render()

  const texts = circuit.db.pcb_note_text.list()
  expect(texts).toHaveLength(0)

  const errors = circuit.db.source_missing_property_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].property_name).toBe("text")
  expect(errors[0].message).toContain("pcb_note_text")
})
