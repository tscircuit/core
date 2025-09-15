import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("board with resistor being passed schX and pcbX in mm", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm" pcbRelative schRelative>
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX="2mm"
        pcbX="-2mm"
      />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
