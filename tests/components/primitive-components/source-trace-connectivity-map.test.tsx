import { test, expect } from "bun:test";
import type { TraceI } from "lib/components/primitive-components/Trace/TraceI";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("source trace connectivity map keys are generated", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <net name="NET1" />
      <trace from=".R1 > .pin1" to="net.NET1" />
      <trace from=".R2 > .pin1" to="net.NET1" />
    </board>,
  );

  circuit.render();

  // Get all source traces
  const sourceTraces = circuit.db.source_trace.list();
  expect(sourceTraces.length).toBe(2);

  // Both traces should have the same connectivity map key since they connect to the same net
  const [trace1, trace2] = sourceTraces;
  expect(trace1.subcircuit_connectivity_map_key).toBeTruthy();
  expect(trace2.subcircuit_connectivity_map_key).toBeTruthy();
  expect(trace1.subcircuit_connectivity_map_key!).toBe(
    trace2.subcircuit_connectivity_map_key!,
  );

  // Get the actual Trace components and verify they also have the key
  const traces = circuit.selectAll("trace") as TraceI[];
  expect(traces.length).toBe(2);
  expect(traces[0].subcircuit_connectivity_map_key).toBe(
    trace1.subcircuit_connectivity_map_key!,
  );
  expect(traces[1].subcircuit_connectivity_map_key).toBe(
    trace2.subcircuit_connectivity_map_key!,
  );
});
