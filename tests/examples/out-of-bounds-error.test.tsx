import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture.ts";
import "../fixtures/extend-expect-circuit-snapshot.ts"; // Import custom matchers

test("placing components outside the board should log errors and match snapshot", async () => {
  // Initialize test fixture and RootCircuit
  const { circuit } = getTestFixture();
  
  // Add components to the circuit
  circuit.add(
    <board width="1mm" height="10mm">
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX={3}
        pcbX={3}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  );

  // Render the project asynchronously until settled
  await circuit.render();

  // Use the custom matcher to verify circuit JSON errors against the snapshot
  expect(circuit.getCircuitJsonErrors()).toMatchPcbSnapshot(import.meta.path);
});