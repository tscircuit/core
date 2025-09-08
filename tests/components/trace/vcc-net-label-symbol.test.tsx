import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify that upward-facing V* net labels become rail_up symbols

test("v net labels become rail symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <netlabel net="VCC" schX={0} schY={0} anchorSide="bottom" />
    </board>,
  )

  circuit.render()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(1)
  expect(labels[0].symbol_name).toBe("rail_up")
  expect(labels[0].text).toBe("VCC")
})
