import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("board with manual schematic placement edits", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
          {
            selector: "C1",
            center: { x: -5, y: -5 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <capacitor name="C1" capacitance="10uF" footprint="0603" />
    </board>,
  );

  circuit.render();

  const resistor = circuit.selectOne(".R1");
  const capacitor = circuit.selectOne(".C1");

  expect(resistor).not.toBeNull();
  expect(capacitor).not.toBeNull();

  const resistorPosition = resistor!._getGlobalSchematicPositionBeforeLayout();
  const capacitorPosition =
    capacitor!._getGlobalSchematicPositionBeforeLayout();

  expect(resistorPosition.x).toBeCloseTo(5, 1);
  expect(resistorPosition.y).toBeCloseTo(5, 1);

  expect(capacitorPosition.x).toBeCloseTo(-5, 1);
  expect(capacitorPosition.y).toBeCloseTo(-5, 1);

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
