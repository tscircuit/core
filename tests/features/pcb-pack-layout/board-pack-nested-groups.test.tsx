import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { writeGlobalDebugGraphics } from "tests/fixtures/writeGlobalDebugGraphics";

const getBounds = (pad: any) => {
  if (pad.shape === "circle") {
    return {
      left: pad.x - pad.radius,
      right: pad.x + pad.radius,
      top: pad.y + pad.radius,
      bottom: pad.y - pad.radius,
    };
  }
  if (pad.shape === "rect") {
    return {
      left: pad.x - pad.width / 2,
      right: pad.x + pad.width / 2,
      top: pad.y + pad.height / 2,
      bottom: pad.y - pad.height / 2,
    };
  }
  if (pad.shape === "rotated_rect") {
    const angle = (pad.ccw_rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const w2 = pad.width / 2;
    const h2 = pad.height / 2;
    const xExtent = Math.abs(w2 * cos) + Math.abs(h2 * sin);
    const yExtent = Math.abs(w2 * sin) + Math.abs(h2 * cos);
    return {
      left: pad.x - xExtent,
      right: pad.x + xExtent,
      top: pad.y + yExtent,
      bottom: pad.y - yExtent,
    };
  }
  if (pad.shape === "pill") {
    const w2 = pad.width / 2;
    const h2 = pad.height / 2;
    const r = pad.radius;
    return {
      left: pad.x - Math.max(w2, r),
      right: pad.x + Math.max(w2, r),
      top: pad.y + Math.max(h2, r),
      bottom: pad.y - Math.max(h2, r),
    };
  }
  if (pad.shape === "polygon") {
    const xs = pad.points.map((p: any) => p.x);
    const ys = pad.points.map((p: any) => p.y);
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.max(...ys),
      bottom: Math.min(...ys),
    };
  }
  throw new Error(`Unknown pad shape: ${pad.shape}`);
};

test("board packs nested groups", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board pack gap="5mm" routingDisabled>
      <group subcircuit pack gap="1mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="10nF" footprint="0402" />
      </group>
      <group subcircuit pack gap="1mm">
        <resistor name="R2" resistance="1k" footprint="0402" />
        <capacitor name="C2" capacitance="10nF" footprint="0402" />
      </group>
    </board>,
  );

  await circuit.renderUntilSettled();

  const pcbGroups = circuit.db.pcb_group.list();
  expect(pcbGroups.length).toBe(2);

  const board = circuit.db.pcb_board.list()[0];

  const pads = circuit.db.pcb_smtpad.list();

  expect(circuit).toMatchPcbSnapshot(import.meta.path);

  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      const pa = pads[i] as any;
      const pb = pads[j] as any;
      if (pa.layer !== pb.layer) continue;
      const a = getBounds(pa);
      const b = getBounds(pb);
      const overlap = !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom > b.top ||
        a.top < b.bottom
      );
      expect(overlap, "pads are overlapping").toBe(false);
    }
  }
  writeGlobalDebugGraphics();
});
