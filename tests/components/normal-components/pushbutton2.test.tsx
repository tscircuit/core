import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("<pushbutton /> component 2 - multiple push buttons", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="30mm" height="10mm">
      <pushbutton name="SW1" footprint="pushbutton" pcbX={-8} schX={-3} />
      <pushbutton name="SW2" footprint="pushbutton" pcbX={8} schX={3} />
      <trace from=".SW1 .pin2" to=".SW2 .pin1" />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
