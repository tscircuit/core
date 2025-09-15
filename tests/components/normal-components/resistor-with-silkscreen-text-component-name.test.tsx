import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
test("resistor with silkscreen text component name", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="36mm" height="12mm">
      <resistor
        name="R1 0Degree"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        pcbRotation={0}
      />
      <resistor
        name="R2 60Degree"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={0}
        pcbRotation={60}
      />
      <resistor
        name="R3 -160Degree"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
        pcbRotation={-160}
      />
      <resistor
        name="R4 180Degree"
        resistance="10k"
        footprint="0402"
        pcbX={10}
        pcbY={0}
        pcbRotation={180}
      />
      <resistor
        name="R5 300Degree"
        resistance="10k"
        footprint="0402"
        pcbX={15}
        pcbY={0}
        pcbRotation={300}
      />
      <resistor
        name="R6 -180Degree"
        resistance="10k"
        footprint="0402"
        pcbX={-10}
        pcbY={0}
        pcbRotation={-180}
      />
      <resistor
        name="R7 -280Degree"
        resistance="10k"
        footprint="0402"
        pcbX={-15}
        pcbY={0}
        pcbRotation={-280}
      />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0);
});
