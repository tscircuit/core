import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("resistor without footprint throws well-formed error", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" pcbX={0} pcbY={0} />
    </board>,
  );

  circuit.render();

  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(1);
});
