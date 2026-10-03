import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

// Regression test for #3107: capacitor bypassFor/bypassTo props were accepted
// by the type schema but never consumed, so no bypass source traces were created.

test("capacitor bypassFor/bypassTo creates bypass source traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        bypassFor={sel.net.V3_3}
        bypassTo={sel.net.GND}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.source_trace.list().map((t) => t.display_name)
  expect(traces).toMatchInlineSnapshot(`
    [
      "capacitor.C1 > port.1 to net.V3_3",
      "capacitor.C1 > port.2 to net.GND",
    ]
  `)

  expect(circuit.db.schematic_net_label.list()).toHaveLength(2)
})
