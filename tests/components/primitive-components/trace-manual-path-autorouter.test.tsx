import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Ensure manual pcbPath does not create duplicate traces when autorouter is enabled

test("manual pcbPath with autorouter does not duplicate traces", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm" autorouter="sequential-trace">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-2}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={2} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={[{ x: 1, y: 0 }]}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  const traces = circuit.db.pcb_trace.list();
  expect(traces).toHaveLength(1);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});

test("multiple manual pcbPaths from shared pad do not duplicate traces", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm" autorouter="sequential-trace">
      <group>
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0402"
          pcbX={-5}
          pcbY={2.0}
        />
        <trace
          from="INPUT_GND_PAD.pin1"
          to="C1.neg"
          pcbPath={[{ x: -1, y: 2 }]}
        />

        <capacitor
          name="C2"
          capacitance="1uF"
          footprint="0402"
          pcbX={-1}
          pcbY={2.0}
        />
        <trace
          from="INPUT_GND_PAD.pin1"
          to="C2.neg"
          pcbPath={[{ x: 0, y: 2 }]}
        />

        <pinheader name="INPUT_GND_PAD" pinCount={1} pcbX={-1} pcbY={-3} />
      </group>
    </board>,
  );

  await circuit.renderUntilSettled();

  const traces = circuit.db.pcb_trace.list();
  expect(traces).toHaveLength(2);
  expect(circuit).toMatchPcbSnapshot(import.meta.path + "multiple-manual");
});
