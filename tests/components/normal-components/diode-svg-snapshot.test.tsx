import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("diode SVG snapshot", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <diode name="D1" footprint="0603" />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
