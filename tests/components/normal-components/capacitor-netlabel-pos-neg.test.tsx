import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

// Verify that capacitor pins can be referenced using pos/neg with netlabels

test("netlabel connects to capacitor neg pin", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C1" polarized capacitance="1uF" footprint="0402" />
      <netlabel net="GND" schX={3} connectsTo={sel.C1.neg} />
    </board>,
  )

  circuit.render()

  const traces = circuit.db.source_trace
    .list()
    .map((t) => t.display_name)
    .sort()
  expect(traces).toMatchInlineSnapshot(`
    [
      ".C1 > .neg to net.GND",
    ]
  `)
})
