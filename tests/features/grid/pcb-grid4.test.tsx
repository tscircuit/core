import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("pcb-grid4", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board
      pcbGrid
      pcbGridTemplateColumns="30% 30%"
      pcbGridTemplateRows="30% 30%"
      pcbGridRowGap={"8mm"}
      pcbGridColumnGap={"8mm"}
      routingDisabled
    >
      <group pcbGrid name="group1">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="1k" footprint="0402" />
        <resistor name="R3" resistance="1k" footprint="0402" />
        <resistor name="R4" resistance="1k" footprint="0402" />
      </group>
      <group pcbGrid name="group2">
        <resistor name="R5" resistance="1k" footprint="0402" />
        <resistor name="R6" resistance="1k" footprint="0402" />
        <resistor name="R7" resistance="1k" footprint="0402" />
        <resistor name="R8" resistance="1k" footprint="0402" />
      </group>
      <group pcbGrid name="group3">
        <resistor name="R9" resistance="1k" footprint="0402" />
        <resistor name="R10" resistance="1k" footprint="0402" />
        <resistor name="R11" resistance="1k" footprint="0402" />
        <resistor name="R12" resistance="1k" footprint="0402" />
      </group>
      <group pcbGrid name="group4">
        <resistor name="R13" resistance="1k" footprint="0402" />
        <resistor name="R14" resistance="1k" footprint="0402" />
        <resistor name="R15" resistance="1k" footprint="0402" />
        <resistor name="R16" resistance="1k" footprint="0402" />
      </group>
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
