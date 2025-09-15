import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";

test("chip with externally connected pins repro", async () => {
  const { circuit } = getTestFixture();
  circuit.add(
    <board width="20mm" height="15mm" routingDisabled={true}>
      <chip
        schHeight={1.2}
        schPinArrangement={{
          topSide: {
            direction: "left-to-right",
            pins: ["pin1", "pin3"],
          },
          bottomSide: {
            direction: "right-to-left",
            pins: ["pin2", "pin4"],
          },
        }}
        name="U1"
      />
    </board>,
  );

  circuit.render();
  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
