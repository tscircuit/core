import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

test("pcbPack respects component constraints", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board pcbPack>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <constraint pcb centerToCenter left="R1" right="R2" xDist="5mm" />
      <resistor name="R3" resistance="1k" footprint="0603" />
    </board>,
  );

  await circuit.renderUntilSettled();

  const r1Source = circuit.db.source_component.getWhere({ name: "R1" })!;
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!;

  const r1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r1Source.source_component_id,
  })!;
  const r2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!;

  const pads = circuit.db.pcb_smtpad.list();
  const r1Pads = pads.filter(
    (p) => p.pcb_component_id === r1Pcb.pcb_component_id,
  );
  const r2Pads = pads.filter(
    (p) => p.pcb_component_id === r2Pcb.pcb_component_id,
  );

  let min = Infinity;
  for (const a of r1Pads) {
    for (const b of r2Pads) {
      const d = distance(a as any, b as any);
      if (d < min) min = d;
    }
  }

  expect(min).toBeGreaterThan(3);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
