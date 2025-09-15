import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("board with routingDisabled should not create pcb_trace", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  );

  circuit.render();

  const pcbTraces = circuit.db.pcb_trace.list();
  expect(pcbTraces.length).toBe(0);

  const sourceTraces = circuit.db.source_trace.list();
  expect(sourceTraces.length).toBe(1);
});
