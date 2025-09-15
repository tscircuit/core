import { expect, test } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// When no layout is specified and children have no schX/schY the group should default to matchAdapt

test("group defaults to matchAdapt schematic layout", () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <group name="G1">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="1uF" footprint="0402" />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </group>
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
