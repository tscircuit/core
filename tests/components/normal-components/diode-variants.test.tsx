import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("diode SVG snapshot", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <diode schottky name="D1" />
      <diode avalanche name="D2" schY={-1} />
      <diode zener name="D3" schY={-2} />
      <diode photo name="D4" schY={-3} />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
