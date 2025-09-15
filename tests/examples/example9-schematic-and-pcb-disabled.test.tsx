import { expect, test } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";

test("Should not render any schematic components", async () => {
  const { circuit } = getTestFixture();
  circuit.schematicDisabled = true;
  circuit.pcbDisabled = true;
  circuit.add(
    <board width={10} height={10}>
      <chip
        name="U1"
        manufacturerPartNumber="part-number"
        schX={0}
        schY={0}
        schWidth={1}
        schHeight={5}
        footprint="ssop28Db"
      />
      <diode
        name="LED1"
        footprint="0805"
        symbolName="diode"
        schX={2}
        schY={1}
      />
      <trace path={[".LED1 > port.right", ".U1 > .pin20"]} />
    </board>,
  );

  circuit.render();

  const schematicComponents = circuit
    .getCircuitJson()
    .filter((c) => c.type === "schematic_component");
  expect(schematicComponents.length).toBe(0);
  const traces = circuit
    .getCircuitJson()
    .filter((c) => c.type === "schematic_trace");
  expect(traces.length).toBe(0);
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
  const pcbComponents = circuit
    .getCircuitJson()
    .filter((c) => c.type === "pcb_component");
  expect(pcbComponents.length).toBe(0);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
