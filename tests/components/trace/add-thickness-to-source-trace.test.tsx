import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("add thickness to the trace", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
      />
      <capacitor capacitance="1000pF" footprint="0402" name="C2" schX={-3} />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" thickness={1.2} />
      <trace from=".R1 > .pin2" to=".C2 > .pin1" />
    </board>,
  );

  circuit.render();

  const source_trace = circuit.db.source_trace.list()[0];
  expect(source_trace.min_trace_thickness).toBeDefined();
  expect(source_trace.min_trace_thickness).toBe(1.2);
});
