import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";

test("repro51: overlap junction crossing", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board pcbPack>
      {/* --- 555 timer as a generic 8‑pin chip --- */}
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["RESET", "CTRL", "THRES", "TRIG"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "OUT", "DISCH", "GND"],
          },
        }}
      />
      <pinheader
        name="J1"
        pinCount={3}
        footprint="pinrow3"
        gender="male"
        schFacingDirection="left"
        pinLabels={{ pin1: "VCC", pin2: "OUT", pin3: "GND" }}
        connections={{ VCC: "net.VCC", OUT: "net.OUT", GND: "net.GND" }}
      />
      <trace from="U1.VCC" to="net.VCC" />
      <trace from="U1.GND" to="net.GND" />
      <trace from="C1.pin2" to="net.GND" />
      <trace from="U1.DISCH" to="R2.pin1" />
      <trace from="U1.OUT" to="net.OUT" />
    </board>,
  );

  circuit.render();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
});
