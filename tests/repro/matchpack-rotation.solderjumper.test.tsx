import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture";

/**
 * Repro for Issue #1226:
 * Solderjumpers placed by matchpack should inherit group rotation
 */
test("matchpack: solderjumper should inherit group rotation", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="20mm">
      <group name="G1" pcbRotation={90}>
        <chip name="U1" />
        <resistor name="R1" resistance="10k" />
        <solderjumper name="SJ1" />
      </group>
    </board>
  );

  circuit.render();

  // Grab components
  const u1 = circuit.selectOne("chip.U1") as any;
  const r1 = circuit.selectOne("resistor.R1") as any;
  const sj1 = circuit.selectOne("solderjumper.SJ1") as any;

  const rot = (el: any) =>
    el?.pcb_rotation ?? el?.ccw_rotation ?? el?.rotation ?? el?.pcb?.rotation;

  expect(rot(u1)).toBe(90);
  expect(rot(r1)).toBe(90);

  // Expected to fail right now (bug): SJ1 does not inherit rotation
  expect(rot(sj1)).toBe(90);
});
