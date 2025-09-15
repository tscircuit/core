import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("resistor with unconnected pins emits source_pin_missing_trace_warning", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  );

  await circuit.renderUntilSettled();

  const warnings = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_pin_missing_trace_warning");

  expect(warnings).toHaveLength(2);
});
