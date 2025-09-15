import { it, expect } from "bun:test";
import { getTestFixture } from "./get-test-fixture";

it("should be able to create a 3D snapshot of a circuit", async () => {
  const { circuit } = await getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  );
  circuit.render();
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path);
});
