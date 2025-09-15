import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("renders resonator symbol variants", async () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board width="10mm" height="10mm">
      <resonator
        name="K1"
        frequency="1MHz"
        loadCapacitance="20pF"
        pinVariant="no_ground"
      />
      <resonator
        name="K2"
        frequency="16MHz"
        loadCapacitance="22pF"
        pinVariant="ground_pin"
        schY={-4}
      />
      <resonator
        name="K3"
        frequency="32MHz"
        loadCapacitance="18pF"
        pinVariant="two_ground_pins"
        schX={6}
      />
      <resonator
        name="K4"
        frequency="8MHz"
        loadCapacitance="15pF"
        schX={6}
        schY={-4}
      />
    </board>,
  );
  circuit.render();
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
