import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("should render rotated versions of capacitors", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor
        name="C1_n90"
        schY={0}
        schX={3}
        capacitance="10µF"
        schRotation={-90}
      />

      <capacitor
        name="C2_n180"
        schY={0}
        schX={6}
        capacitance="10µF"
        schRotation={-180}
      />

      <capacitor
        name="C3_n270"
        schY={0}
        schX={9}
        capacitance="10µF"
        schRotation={-270}
      />

      <capacitor
        name="C4_n360"
        schY={3}
        schX={3}
        capacitance="10µF"
        schRotation={-360}
      />

      <capacitor name="C5_noRotation" schY={3} schX={6} capacitance="10µF" />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
