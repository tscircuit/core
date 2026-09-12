import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("RS232 trace extends into an adjacent schematic section", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  // Reduced from SparkFun-RS232-Breakout. Preserve the pin rows and capacitor
  // placement: they trigger an inline-net-label clearance trace on C2.pin2.
  circuit.add(
    <board>
      <schematicsection name="rs232" displayName="RS-232 / DE9 Connector" />
      <schematicsection name="transceiver" displayName="RS-232 Transceiver" />
      <chip
        pinLabels={{
          pin1: ["EN"],
          pin2: ["C1_POS"],
          pin3: ["V_POS"],
          pin4: ["C1_NEG"],
          pin5: ["C2_POS"],
          pin6: ["C2_NEG"],
          pin7: ["V_NEG"],
          pin8: ["T2OUT"],
          pin9: ["R2IN"],
          pin10: ["R2OUT"],
          pin11: ["STATUS"],
          pin12: ["T2IN"],
          pin13: ["T1IN"],
          pin14: ["ONLINE"],
          pin15: ["R1OUT"],
          pin16: ["R1IN"],
          pin17: ["T1OUT"],
          pin18: ["GND"],
          pin19: ["VCC"],
          pin20: ["SHUTDOWN"],
        }}
        name="U2"
        schSectionName="transceiver"
        schX={0}
        schY={0}
        schWidth={2}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: [
              "pin2",
              "pin4",
              "pin1",
              "pin20",
              "pin13",
              "pin12",
              "pin15",
              "pin10",
            ],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: [
              "pin5",
              "pin6",
              "pin3",
              "pin7",
              "pin17",
              "pin8",
              "pin16",
              "pin9",
            ],
          },
          topSide: {
            direction: "left-to-right",
            pins: ["pin19"],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: ["pin18"],
          },
        }}
        connections={{
          C1_POS: ".C2 > .pin1",
          C1_NEG: ".C2 > .pin2",
          VCC: "net.VCC",
          GND: "net.GND",
          EN: "net.EN",
          SHUTDOWN: "net.SHDN",
          T1IN: "net.TX_IN",
          R1OUT: "net.RX_OUT",
          T2IN: "net.RTS_IN",
          R2OUT: "net.CTS_OUT",
          T1OUT: "net.TxD_DE9",
          R1IN: "net.RxD_DE9",
          T2OUT: "net.RTS_DE9",
          R2IN: "net.CTS_DE9",
        }}
      />
      <chip
        pinLabels={{
          pin1: "1",
          pin2: "2",
          pin3: "3",
          pin4: "4",
          pin5: "5",
          pin6: "6",
          pin7: "7",
          pin8: "8",
          pin9: "9",
        }}
        name="J3"
        schSectionName="rs232"
        schX={-6.8}
        schY={0}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin1", "pin2", "pin3", "pin4", "pin5"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["pin6", "pin7", "pin8", "pin9"],
          },
        }}
        connections={{
          pin2: "net.TxD_DE9",
          pin3: "net.RxD_DE9",
          pin5: "net.GND",
          pin7: "net.CTS_DE9",
          pin8: "net.RTS_DE9",
        }}
      />
      <capacitor
        name="C2"
        capacitance="0.1uF"
        schSectionName="transceiver"
        schX={-2.8}
        schY={0.6}
        schRotation={-90}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Capture the current bug: C2.pin2 has a dangling trace extending left
  // across the divider. Its intended connection, U2.C1_NEG to C2.pin2,
  // belongs entirely to the transceiver section.
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
