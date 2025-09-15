import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";

test("board with local group autorouter (capacity mesh)", async () => {
  const { circuit } = getTestFixture();

  // Create a circuit with two components that need to be connected by a trace
  // The capacity mesh autorouter will be used to find the optimal route
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      <resistor
        name="R1"
        pcbX={-5}
        pcbY={0}
        resistance={10000}
        footprint="0402"
      />
      <resistor
        name="R2_obstacle"
        resistance="1k"
        pcbX={0}
        pcbY={0}
        footprint="0402"
      />
      <led name="LED1" pcbX={5} pcbY={0} footprint="0603" />

      <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    </board>,
  );

  // Wait for the render to complete, including autorouting
  await circuit.renderUntilSettled();

  // Verify that we have PCB traces in the output
  const traces = circuit.selectAll("trace");
  expect(traces.length).toBeGreaterThan(0);

  // Match against a PCB snapshot to verify routing
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
