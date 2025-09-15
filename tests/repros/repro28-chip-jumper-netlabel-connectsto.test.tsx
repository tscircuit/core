import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("chip with jumper and netlabel connectsTo", async () => {
  const { circuit } = getTestFixture()

  const pinLabels = {
    pin1: "VCC",
    pin2: "A1",
    pin3: "A2",
    pin4: "A3",
    pin5: "A4",
    pin7: "GND",
    pin8: "OE",
    pin10: "B4",
    pin11: "B3",
    pin12: "B2",
    pin13: "B1",
    pin14: "VCC",
  }

  circuit.add(
    <board
      width="20mm"
      height="15mm"
      routingDisabled={true}
      schMaxTraceDistance={5}
    >
      <chip
        pinLabels={pinLabels}
        footprint="soic8"
        name="U1"
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin8", "pin2", "pin3", "pin4", "pin5"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["pin7"],
          },
          topSide: {
            direction: "left-to-right",
            pins: ["pin1", "pin14"],
          },
          rightSide: {
            direction: "bottom-to-top",
            pins: ["pin10", "pin11", "pin12", "pin13"],
          },
        }}
        schWidth={1.8}
        schHeight={2}
        schPinStyle={{
          pin8: {
            bottomMargin: 0.2,
          },
          pin1: {
            rightMargin: 0.1,
          },
          pin14: {
            leftMargin: 0.1,
          },
          pin13: {
            topMargin: 0.4,
          },
        }}
      />

      <netlabel
        net="V3_3"
        anchorSide="bottom"
        connectsTo={["U1.pin1", "JP1.pin2"]}
        schY={2.5}
        schX={-0.2}
      />
      <netlabel
        net="V5"
        anchorSide="bottom"
        connectsTo={["U1.pin14", "JP2.pin2"]}
        schY={2.5}
        schX={0.2}
      />

      <pinheader
        name="JP1"
        pinCount={7}
        footprint="pinrow7_p2.54_id1.016_od1.8769_nosquareplating_doublesidedpinlabel"
        pitch="2.54mm"
        gender="female"
        schX={-4}
        schPinArrangement={{
          rightSide: {
            direction: "bottom-to-top",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5", "pin6", "pin7"],
          },
        }}
        connections={{
          pin1: sel.U1.pin7,
          pin3: sel.U1.pin5,
          pin4: sel.U1.pin4,
          pin5: sel.U1.pin3,
          pin6: sel.U1.pin2,
          pin7: sel.net().OE,
        }}
        schY={-0.3}
      />
      <pinheader
        name="JP2"
        pinCount={7}
        schFacingDirection="left"
        footprint="pinrow7_p2.54_id1.016_od1.8769_nosquareplating_doublesidedpinlabel"
        pitch="2.54mm"
        gender="female"
        schX={4}
        schPinArrangement={{
          leftSide: {
            direction: "bottom-to-top",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5", "pin6", "pin7"],
          },
        }}
        connections={{
          pin1: sel.net().GND,
          pin3: sel.U1.pin10,
          pin4: sel.U1.pin11,
          pin5: sel.U1.pin12,
          pin6: sel.U1.pin13,
          pin7: sel.net().DE,
        }}
        schY={-0.3}
      />
      <netlabel
        net="DE"
        anchorSide="left"
        connection="JP2.pin7"
        schX={3}
        schY={0.8}
      />
      <netlabel
        net="GND"
        anchorSide="top"
        connectsTo={["JP2.pin1", "U1.pin7"]}
        schX={1.5}
        schY={-1.8}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
