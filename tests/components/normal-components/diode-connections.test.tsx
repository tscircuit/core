import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("diode with connections", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <diode
        name="D1"
        connections={{
          anode: "net.VCC",
          cathode: "net.GND",
        }}
      />
    </board>,
  );

  await circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
