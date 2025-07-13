import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { sel } from "lib/sel"

test(
  "pinheader connections with netlabels",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="22.86mm" height="27.94mm" autorouter="auto-cloud">
        <pinheader
          name="JP1"
          pinCount={4}
          footprint="pinrow4_p2.54_id1.016_od1.8769_doublesidedpinlabel"
          gender="female"
          schPinArrangement={{
            rightSide: {
              direction: "bottom-to-top",
              pins: ["pin1", "pin2", "pin3", "pin4"],
            },
          }}
          pitch="1mm"
          pcbY={-12.7}
          schX={13}
          schY={4}
          connections={{
            pin1: sel.net().FIVE,
            pin2: sel.net().THREE,
            pin3: sel.net().TWO,
            pin4: sel.net().ONE,
          }}
        />
        <netlabel
          net="FIVE"
          schX={14}
          schY={3.7}
          connection="JP1.pin1"
          anchorSide="left"
        />
        <netlabel
          net="THREE"
          schX={14}
          schY={3.9}
          connection="JP1.pin2"
          anchorSide="left"
        />
        <netlabel
          net="TWO"
          schX={14}
          schY={4.1}
          connection="JP1.pin3"
          anchorSide="left"
        />
        <netlabel
          net="ONE"
          schX={14}
          schY={4.3}
          connection="JP1.pin4"
          anchorSide="left"
        />

        <pinheader
          name="JP4"
          pinCount={8}
          footprint={
            <footprint name="RJ45-8">
              <platedhole
                portHints={["pin1"]}
                pcbX="-4.445mm"
                pcbY="6.35mm"
                holeDiameter="1mm"
                shape="circular_hole_with_rect_pad"
                rectPadWidth="1.8796mm"
                rectPadHeight="1.8796mm"
              />
              <platedhole
                portHints={["pin2"]}
                pcbX="-3.175mm"
                pcbY="8.89mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <platedhole
                portHints={["pin3"]}
                pcbX="-1.905mm"
                pcbY="6.35mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <platedhole
                portHints={["pin4"]}
                pcbX="-0.635mm"
                pcbY="8.89mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <platedhole
                portHints={["pin5"]}
                pcbX="0.635mm"
                pcbY="6.35mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <platedhole
                portHints={["pin6"]}
                pcbX="1.905mm"
                pcbY="8.89mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <platedhole
                portHints={["pin7"]}
                pcbX="3.175mm"
                pcbY="6.35mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <platedhole
                portHints={["pin8"]}
                pcbX="4.445mm"
                pcbY="8.89mm"
                holeDiameter="1mm"
                outerDiameter="1.8796mm"
                shape="circle"
              />
              <hole pcbX="-5.715mm" pcbY="0mm" diameter="3.2mm" />
              <hole pcbX="5.715mm" pcbY="0mm" diameter="3.2mm" />
              <silkscreenpath
                route={[
                  { x: -7.62, y: 10 },
                  { x: 7.62, y: 10 },
                  { x: 7.62, y: -3 },
                  { x: -7.62, y: -3 },
                  { x: -7.62, y: 10 },
                ]}
                strokeWidth="0.2032mm"
              />
            </footprint>
          }
          gender="female"
          pitch="2.54mm"
          pinLabels={["1", "2", "3", "4", "5", "6", "7", "8"]}
          schX={13}
          schY={-3}
          pcbX={8.89}
          pcbRotation={90}
          connections={{
            pin1: sel.net().ONE,
            pin2: sel.net().TWO,
            pin3: sel.net().THREE,
            pin4: sel.JP4.pin5,
            pin5: sel.net().GND,
            pin6: sel.net().FIVE,
            pin7: sel.net().B,
            pin8: sel.net().A,
          }}
          schWidth={0.9}
        />
        <netlabel
          net="GND"
          schX={16}
          schY={-3.5}
          connection="JP4.pin5"
          anchorSide="top"
        />
        <netlabel
          net="ONE"
          schX={15}
          schY={-2.3}
          connection="JP4.pin1"
          anchorSide="left"
        />
        <netlabel
          net="TWO"
          schX={15}
          schY={-2.5}
          connection="JP4.pin2"
          anchorSide="left"
        />
        <netlabel
          net="THREE"
          schX={15}
          schY={-2.7}
          connection="JP4.pin3"
          anchorSide="left"
        />
        <netlabel
          net="FIVE"
          schX={15}
          schY={-3.3}
          connection="JP4.pin6"
          anchorSide="left"
        />
        <netlabel
          net="B"
          schX={15}
          schY={-3.5}
          connection="JP4.pin7"
          anchorSide="left"
        />
        <netlabel
          net="A"
          schX={15}
          schY={-3.7}
          connection="JP4.pin8"
          anchorSide="left"
        />
      </board>,
    )

    circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
  {
    timeout: 30_000,
  },
)
