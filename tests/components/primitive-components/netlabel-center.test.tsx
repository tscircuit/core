import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

// Verify that net label center is offset based on anchor side

test("netlabel center offset", () => {
  const { circuit } = getTestFixture();

  circuit._featureMspSchematicTraceRouting = true;

  circuit.add(
    <board routingDisabled>
      <resistor schX={4} name="R1" resistance="1k" />
      <chip
        name="U1"
        footprint="soic8"
        connections={{
          pin1: "R1.1",
          pin2: "net.TESTNET",
          pin6: "R1.2",
        }}
      />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);

  const labels = circuit.db.schematic_net_label.list();

  const label = labels.find((l) => l.text === "TESTNET")!;
  expect(label.anchor_side).toBe("right");
  expect(label.center.x).toBeLessThan(label.anchor_position!.x);
});
