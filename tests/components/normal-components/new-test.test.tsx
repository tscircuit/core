import { expect, test } from "bun:test";
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("resistor schematic", () => {
  const { project } = getTestFixture();

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
      />
      <capacitor
        name="C1"
        capacitance="100n"
        footprint="0603"
        schX={2}
        schY={0}
      />
      <trace from={".R1 pin.2"} to={".C1 pin.1"} />
    </board>
  );

  project.render();

  const fs = require('node:fs');
  const circuitJson = project.getCircuitJson();
  fs.writeFileSync('circuit.json', JSON.stringify(circuitJson, null, 2));

  // expect(convertCircuitJsonToSchematicSvg(circuitJson)).toMatchSvgSnapshot(
  //   import.meta.path
  // );
});
