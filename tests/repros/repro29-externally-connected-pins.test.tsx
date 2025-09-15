import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";

test("chip with externally connected pins repro", async () => {
  const { circuit } = getTestFixture();
  const pinLabels = {
    pin1: ["VDDIO", "V3_3"],
    pin2: ["NC1"],
    pin3: ["RESERVED1"],
    pin4: ["SCLK"],
    pin5: ["RESERVED2"],
    pin6: ["MOSI"],
    pin7: ["MISO"],
    pin8: ["N_CS"],
    pin9: ["INT2"],
    pin10: ["RESERVED3"],
    pin11: ["INT1"],
    pin12: ["GND1"],
    pin13: ["GND2"],
    pin14: ["VS"],
    pin15: ["NC2"],
    pin16: ["GND3"],
  } as const;
  circuit.add(
    <board width="20mm" height="15mm" routingDisabled={true}>
      <chip
        name="U1"
        schWidth={1.7}
        footprint="pinrow16"
        externallyConnectedPins={[["pin12", "pin13"]]}
        pinLabels={pinLabels}
        schPinArrangement={{
          rightSide: {
            direction: "top-to-bottom",
            pins: [1, 14, 11, 9],
          },
          leftSide: {
            direction: "top-to-bottom",
            pins: [4, 6, 7, 8],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: [12],
          },
        }}
      />
    </board>,
  );

  circuit.render();

  // Verify that traces are created for externally connected pins
  const traces = circuit.selectAll("trace");
  expect(traces.length).toBeGreaterThanOrEqual(1); // Should have at least 1 trace for pin12-pin13 connection

  // Visual snapshot to verify the traces are rendered correctly
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
