import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// ensure Trace with manual pcbPath renders specified route

test("trace with manual pcbPath", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[{ x: 1, y: 0 }]}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const pcbTraces = circuit.db.pcb_trace.list();
  expect(pcbTraces.length).toBe(1);
  await expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
