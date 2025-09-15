import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { sel } from "lib/sel";

// Test that pulldown properties create nets and schematic labels

test("resistor pulldown nets have labels", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        pulldownFor={sel.net.V3_3}
        pulldownTo={sel.net.GND}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const traces = circuit.db.source_trace.list().map((t) => t.display_name);
  expect(traces).toMatchInlineSnapshot(`
    [
      "resistor.R1 > port.1 to net.V3_3",
      "resistor.R1 > port.2 to net.GND",
    ]
  `);

  expect(circuit.db.schematic_net_label.list()).toHaveLength(2);
});
