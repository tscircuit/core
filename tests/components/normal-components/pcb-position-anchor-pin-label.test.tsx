import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Ensure pcbPositionAnchor aligns to a specific pin label

test("pcbPositionAnchor with pin label", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <resistor
      name="R1"
      resistance="1k"
      footprint="0402"
      pcbX={15}
      pcbY={5}
      pcbPositionAnchor="pin1"
    />,
  );

  circuit.render();

  const resistor = circuit.selectOne(".R1");
  const pin1Pos =
    (resistor as any)!.portMap.pin1._getGlobalPcbPositionAfterLayout();

  expect(pin1Pos.x).toBeCloseTo(15);
  expect(pin1Pos.y).toBeCloseTo(5);
});
