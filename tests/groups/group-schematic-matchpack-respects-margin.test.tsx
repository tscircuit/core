import React from "react";
import { expect, test } from "bun:test";
import debug from "debug";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Test that schMarginX is passed to matchpack input problem

test("group schematic matchpack respects schMarginX", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          schMarginX={5}
          schMarginY={10}
        />
        <resistor name="R2" resistance="1k" footprint="0402" />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </group>
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
