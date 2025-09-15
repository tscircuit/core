import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("pcb-grid", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board pcbGrid width="10mm" height="10mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <resistor name="R3" resistance="1k" footprint="0402" />
      <resistor name="R4" resistance="1k" footprint="0402" />
      <resistor name="R5" resistance="1k" footprint="0402" />
      <resistor name="R6" resistance="1k" footprint="0402" />
      <resistor name="R7" resistance="1k" footprint="0402" />
      <resistor name="R8" resistance="1k" footprint="0402" />
      <resistor name="R9" resistance="1k" footprint="0402" />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
