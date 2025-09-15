import { it, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

it("<Led/> component with connections prop", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <led
        name="LED1"
        color="green"
        schDisplayValue="Green"
        connections={{
          pin1: "net.GND",
          pin2: "net.VCC",
        }}
      />
    </board>,
  );

  await circuit.render();

  // Check that traces are created for the connections
  const traces = circuit.db.source_trace.list();
  expect(traces.length).toBe(2);
  expect(traces[0].display_name).toContain("GND");
  expect(traces[1].display_name).toContain("VCC");

  expect(circuit).toMatchSchematicSnapshot(import.meta.path + "-connections");
});
