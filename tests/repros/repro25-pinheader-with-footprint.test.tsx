import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";
import { sel } from "lib/sel";

test("pinheader with footprint in a group", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1">
        <pinheader
          name="J1"
          facingDirection="left"
          pinCount={4}
          schX={2.5}
          schPinArrangement={{
            leftSide: {
              direction: "bottom-to-top",
              pins: ["pin1", "pin2", "pin3", "pin4"],
            },
          }}
          connections={{
            pin1: sel.net.VCC,
          }}
        />
      </group>
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
