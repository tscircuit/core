import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("netlabel without net renders empty text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* netlabel without net or connectsTo should render with <empty> text */}
      <netlabel name="hi" />
    </board>,
  )

  circuit.render()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(1)
  expect(labels[0].text).toBe("<empty>")
})
