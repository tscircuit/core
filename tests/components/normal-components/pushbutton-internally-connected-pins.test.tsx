import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";
import { grid } from "@tscircuit/math-utils";

test("pushbutton internally connected pins", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board>
      <schematictext
        text="Both pins should be drawn on left, overlapping"
        fontSize={0.2}
        schY={2}
      />
      <pushbutton
        name="SW1"
        internallyConnectedPins={[["pin1", "pin2"]]}
        connections={{
          pin1: "net.PIN1",
          pin2: "net.PIN2",
        }}
        footprint="pushbutton_id1.3mm_od2mm"
      />
    </board>,
  );

  const circuitJson = circuit.getCircuitJson();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
