import { expect, test } from "bun:test";
import { sel } from "lib/sel";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

const QuiicFootprint = () => {
  return (
    <footprint name="jstsh4_ra_1mm">
      <smtpad
        portHints={["pin1"]}
        pcbX="-1.5mm"
        pcbY="0mm"
        width="0.6mm"
        height="1.35mm"
        shape="rect"
      />
      <smtpad
        portHints={["pin2"]}
        pcbX="-0.5mm"
        pcbY="0mm"
        width="0.6mm"
        height="1.35mm"
        shape="rect"
      />
      <smtpad
        portHints={["pin3"]}
        pcbX="0.5mm"
        pcbY="0mm"
        width="0.6mm"
        height="1.35mm"
        shape="rect"
      />
      <smtpad
        portHints={["pin4"]}
        pcbX="1.5mm"
        pcbY="0mm"
        width="0.6mm"
        height="1.35mm"
        shape="rect"
      />
      <smtpad
        portHints={["NC2"]}
        pcbX="-2.8mm"
        pcbY="-3.675mm"
        width="1.2mm"
        height="2.0mm"
        shape="rect"
      />
      <smtpad
        portHints={["NC1"]}
        pcbX="2.8mm"
        pcbY="-3.675mm"
        width="1.2mm"
        height="2.0mm"
        shape="rect"
      />
    </footprint>
  );
};

test("chip renders with default name when none provided", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board
      width={10}
      height={10}
      schMaxTraceDistance={5}
      outline={[
        { x: 0, y: 0 },
        { x: 66, y: 0 },
        { x: 66, y: 5 },
        { x: 68.5, y: 7.5 },
        { x: 68.5, y: 40.25 },
        { x: 66, y: 42.75 },
        { x: 66, y: 56.75 },
        { x: 64.5, y: 58.25 },
        { x: 0, y: 58.25 },
      ]}
    >
      <jumper
        name="J2"
        footprint="pinrow10_rows2_p1.27mm_id0.508mm_od1mm_nosquareplating"
        cadModel={null}
        pinLabels={{
          pin1: "GND",
          pin9: "GND",
          pin8: "GND",
          pin7: "VCC",
          pin2: "N_RESET",
          pin4: "SWO",
          pin5: "SWDCLK",
          pin6: "SWDIO",
        }}
        schPinSpacing={0.2}
        schPinStyle={{ pin7: { marginBottom: 0.4 } }}
        schPortArrangement={{
          leftSide: { pins: ["pin9", "pin7"], direction: "left-to-right" },
          rightSide: {
            pins: ["pin2", "pin6", "pin5", "pin4"],
            direction: "left-to-right",
          },
        }}
        pcbX={46.99}
        pcbY={37.338}
      />
      <jumper
        name="J4"
        footprint={<QuiicFootprint />}
        schX={8}
        pinLabels={{ 1: "GND", 2: "VCC", 3: "SDA", 4: "SCL" }}
        schPortArrangement={{
          leftSide: {
            direction: "bottom-to-top",
            pins: ["GND", "VCC", "SDA", "SCL"],
          },
        }}
        pcbX="63.5mm"
        pcbY="19.05mm"
        pcbRotation={90}
        connections={{
          pin1: sel.JP12.pin3,
        }}
      />
      <jumper
        name="JP12"
        pcbX="30.226mm"
        pcbY="57.150mm"
        pinLabels={{
          pin1: "SCL",
          pin2: "SDA",
          pin3: "GND",
          pin4: "GND",
          pin5: "SCK",
          pin6: "MISO",
          pin7: "MOSI",
          pin8: "A10",
          pin9: "A9",
          pin10: "A8",
        }}
        schPortArrangement={{
          leftSide: {
            direction: "bottom-to-top",
            pins: [
              "SCL",
              "SDA",
              "GND",
              "GND",
              "SCK",
              "MISO",
              "MOSI",
              "A10",
              "A9",
              "A8",
            ],
          },
        }}
        footprint="pinrow10_p2.54mm_id1.016mm_od1.880mm_nosquareplating"
        schX={8}
        schY={3}
        connections={{
          pin3: sel.net.GND,
        }}
      />
    </board>,
  );

  await circuit.renderUntilSettled();

  expect(circuit).toMatchSchematicSnapshot(import.meta.path);
  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
