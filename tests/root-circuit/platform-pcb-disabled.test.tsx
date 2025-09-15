import { test, expect } from "bun:test";
import { RootCircuit } from "lib/RootCircuit";

// Verify that pcbDisabled is initialized from platform config

test("pcbDisabled is set from platform config", () => {
  const circuit = new RootCircuit({ platform: { pcbDisabled: true } });
  expect(circuit.pcbDisabled).toBe(true);
});
