import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("chip with pinAttributes shows correct arrows", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        schHeight={2}
        name="U1"
        schX={0}
        schY={0}
        pinLabels={{
          pin1: "V_IN",
          pin2: "GND_IN",
          pin3: "V_OUT",
          // The providesPower is often used for ground pins to indicate they
          // are a source for current return, which is represented as an
          // output arrow.
          pin4: "GND_OUT",
          pin5: "EN",
          pin6: "FAULT",
          pin7: "SDA",
          pin8: "SCL",
        }}
        pinAttributes={{
          V_IN: { requiresPower: true },
          GND_IN: { requiresPower: true },
          V_OUT: { providesPower: true },
          GND_OUT: { providesPower: true },
          EN: { requiresPower: true },
          FAULT: { providesPower: true },
          SDA: { requiresPower: true, providesPower: true },
        }}
        schPinArrangement={{
          leftSide: { pins: ["V_IN", "GND_IN"], direction: "top-to-bottom" },
          rightSide: {
            pins: ["V_OUT", "GND_OUT"],
            direction: "top-to-bottom",
          },
          topSide: { pins: ["EN", "FAULT"], direction: "left-to-right" },
          bottomSide: { pins: ["SDA", "SCL"], direction: "left-to-right" },
        }}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
