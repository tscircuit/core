import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("PCB routing with cutouts", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="50mm" height="30mm" autorouter="sequential-trace">
      <resistor
        resistance={1}
        name="R1"
        footprint="0402"
        pcbX="-20mm"
        pcbY="7mm"
      />
      <resistor
        resistance={1}
        name="R2"
        footprint="0402"
        pcbX="20mm"
        pcbY="7mm"
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />

      <cutout shape="rect" width="5mm" height="10mm" pcbX="-10mm" pcbY="10mm" />
      <cutout shape="circle" radius="4mm" pcbX="0mm" pcbY="2mm" />
      <cutout
        shape="polygon"
        points={[
          { x: 0, y: -5 },
          { x: 1, y: -2 },
          { x: 4, y: -2 },
          { x: 2, y: 0 },
          { x: 3, y: 3 },
          { x: 0, y: 1 },
          { x: -3, y: 3 },
          { x: -2, y: 0 },
          { x: -4, y: -2 },
          { x: -1, y: -2 },
        ]}
        pcbX="12mm"
        pcbY="5mm"
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
