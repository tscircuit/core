import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { writeGlobalDebugGraphics } from "tests/fixtures/writeGlobalDebugGraphics";

// ensure that matchAdapt groups operate independently

export default test("group-match-adapt7", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <group matchAdapt name="group1">
        <resistor name="R1" resistance="1k" />
        <capacitor name="C1" capacitance="10uF" />
        <trace from=".R1 > .pin1" to=".C1 > .pin1" />
      </group>
      <group matchAdapt name="group2" schX={5}>
        <resistor name="R2" resistance="1k" />
        <capacitor name="C2" capacitance="10uF" />
        <trace from=".R2 > .pin1" to=".C2 > .pin1" />
      </group>
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
  writeGlobalDebugGraphics();
});
