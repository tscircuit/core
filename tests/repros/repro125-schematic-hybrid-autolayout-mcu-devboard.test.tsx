import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// 64-pin LQFP MCU with a custom 4-side pin arrangement. The pin labels here are
// a renamed, generic scheme (QA*/QB* GPIO + generic functional names) — NOT the
// labels of any specific real part.
const pinLabels = {
  // ---- Left side of package: pins 1-16 ----
  pin1: "QB13",
  pin2: "QB14",
  pin3: "QB15",
  pin4: "QB16",
  pin5: "QA12",
  pin6: ["QA13", "CP0_2N"],
  pin7: ["QA14", "AD0_12", "CP0_2P"],
  pin8: ["QA15", "AD1_0", "DACO", "OP0_2P", "OP1_2P", "CP0_3P", "CP1_3P"],
  pin9: ["QA16", "AD1_1", "OP1_O"],
  pin10: ["QA17", "AD1_2", "OP1_1N", "CP0_1N"],
  pin11: ["QA18", "AD1_3", "OP1_1P", "CP0_1P", "GAMP_N"],
  pin12: ["QA19", "SWD"],
  pin13: ["QA20", "SWC"],
  pin14: ["QB17", "AD1_4", "CP1_2N"],
  pin15: ["QB18", "AD1_5", "CP1_2P"],
  pin16: ["QB19", "AD1_6", "CP2_1P", "OP1_0P"],

  // ---- Bottom side of package: pins 17-32 ----
  pin17: ["QA21", "AD1_7", "CP2_1N", "AVN"],
  pin18: ["QA22", "AD0_7", "GAMP_O", "OP0_O"],
  pin19: ["QB20", "AD0_6", "OP1_0N"],
  pin20: ["QB21", "CP2_0P"],
  pin21: ["QB22", "CP2_0N"],
  pin22: "QB23",
  pin23: ["QB24", "AD0_5", "CP1_1P"],
  pin24: ["QA23", "CP1_1N", "AVP"],
  pin25: ["QA24", "AD0_3", "OP0_1N"],
  pin26: ["QA25", "AD0_2", "OP0_1P"],
  pin27: ["QB25", "AD0_4"],
  pin28: ["QB26", "CP1_0P"],
  pin29: ["QB27", "CP1_0N"],
  pin30: ["QA26", "AD0_1", "CP0_0P", "OP0_0P", "GAMP_P"],
  pin31: ["QA27", "AD0_0", "CP0_0N", "OP0_0N"],
  pin32: "VCAP",

  // ---- Right side of package: pins 33-48 ----
  pin33: "QA0",
  pin34: "QA1",
  pin35: "QA28",
  pin36: "QA29",
  pin37: "QA30",
  pin38: "RSTN",
  pin39: "QA31",
  pin40: "VCC",
  pin41: "GND",
  pin42: ["QA2", "OSCIN"],
  pin43: ["QA3", "XLI"],
  pin44: ["QA4", "XLO"],
  pin45: ["QA5", "XHI"],
  pin46: ["QA6", "XHO"],
  pin47: "QB0",
  pin48: "QB1",

  // ---- Top side of package: pins 49-64 ----
  pin49: "QA7",
  pin50: "QB2",
  pin51: "QB3",
  pin52: "QB4",
  pin53: "QB5",
  pin54: "QA8",
  pin55: "QA9",
  pin56: "QA10",
  pin57: "QA11",
  pin58: "QB6",
  pin59: "QB7",
  pin60: "QB8",
  pin61: "QB9",
  pin62: "QB10",
  pin63: "QB11",
  pin64: "QB12",
} as const

const MCU64 = (props: any) => (
  <chip
    {...props}
    footprint="lqfp64"
    schWidth={3.96}
    schHeight={4.055}
    pinLabels={pinLabels}
    pinAttributes={{
      VCC: { requiresPower: true },
      GND: { requiresGround: true },
      VCAP: { mustBeConnected: true },
      RSTN: { mustBeConnected: true },
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: [
          "QB13",
          "QB14",
          "QB15",
          "QB16",
          "QA12",
          "QA13",
          "QA14",
          "QA15",
          "QA16",
          "QA17",
          "QA18",
          "QA19",
          "QA20",
          "QB17",
          "QB18",
          "QB19",
        ],
      },
      bottomSide: {
        direction: "left-to-right",
        pins: [
          "QA21",
          "QA22",
          "QB20",
          "QB21",
          "QB22",
          "QB23",
          "QB24",
          "QA23",
          "QA24",
          "QA25",
          "QB25",
          "QB26",
          "QB27",
          "QA26",
          "QA27",
          "VCAP",
        ],
      },
      rightSide: {
        direction: "bottom-to-top",
        pins: [
          "QA0",
          "QA1",
          "QA28",
          "QA29",
          "QA30",
          "RSTN",
          "QA31",
          "VCC",
          "GND",
          "QA2",
          "QA3",
          "QA4",
          "QA5",
          "QA6",
          "QB0",
          "QB1",
        ],
      },
      topSide: {
        direction: "right-to-left",
        pins: [
          "QA7",
          "QB2",
          "QB3",
          "QB4",
          "QB5",
          "QA8",
          "QA9",
          "QA10",
          "QA11",
          "QB6",
          "QB7",
          "QB8",
          "QB9",
          "QB10",
          "QB11",
          "QB12",
        ],
      },
    }}
  />
)

/**
 * repro125: realistic hybrid board — a pinned 64-pin MCU (schX/schY) plus
 * decoupling caps, resistors and pinheaders that are positioned only on the PCB
 * (no schX/schY), with `schAutoLayoutEnabled` on the board. Captures the
 * schematic auto-placement of the unpositioned parts around the pinned MCU.
 */
test("repro125: hybrid auto-layout MCU dev board (schAutoLayoutEnabled)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="50mm" height="45mm" schAutoLayoutEnabled>
      <MCU64
        name="U1"
        schX={0}
        schY={0}
        pcbX={0}
        pcbY={0}
        connections={{
          VCC: "net.VDD",
          GND: "net.GND",
          VCAP: "net.VCORE",
          RSTN: "net.PRST",
          OSCIN: "net.COSC",
          QA0: "net.PA0",
          QA1: "net.PA1",
          SWD: "net.SWDIO",
          SWC: "net.SWCLK",
          AVP: "net.VREF_P",
          AVN: "net.GND",
        }}
      />

      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0805"
        schOrientation="vertical"
        pcbX={11}
        pcbY={-1}
        connections={{ pin1: "net.VDD", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="0.1uF"
        footprint="0402"
        schOrientation="vertical"
        pcbX={11}
        pcbY={2}
        connections={{ pin1: "net.VDD", pin2: "net.GND" }}
      />

      <capacitor
        name="C3"
        capacitance="0.47uF"
        footprint="0402"
        schOrientation="vertical"
        pcbX={7}
        pcbY={-9}
        connections={{ pin1: "net.VCORE", pin2: "net.GND" }}
      />

      <resistor
        name="R1"
        resistance="47k"
        footprint="0402"
        pcbX={11}
        pcbY={5}
        connections={{ pin1: "net.PRST", pin2: "net.VDD" }}
      />
      <capacitor
        name="C4"
        capacitance="10nF"
        footprint="0402"
        schOrientation="vertical"
        pcbX={11}
        pcbY={7}
        connections={{ pin1: "net.PRST", pin2: "net.GND" }}
      />

      <resistor
        name="R2"
        resistance="100k"
        footprint="0402"
        pcbX={11}
        pcbY={-4}
        connections={{ pin1: "net.COSC", pin2: "net.GND" }}
      />

      <resistor
        name="R3"
        resistance="4.7k"
        footprint="0402"
        pcbX={-9}
        pcbY={6}
        connections={{ pin1: "net.PA0", pin2: "net.VDD" }}
      />
      <resistor
        name="R4"
        resistance="4.7k"
        footprint="0402"
        pcbX={-11}
        pcbY={6}
        connections={{ pin1: "net.PA1", pin2: "net.VDD" }}
      />

      <capacitor
        name="C5"
        capacitance="1uF"
        footprint="0402"
        schOrientation="vertical"
        pcbX={-9}
        pcbY={-6}
        connections={{ pin1: "net.VREF_P", pin2: "net.GND" }}
      />

      <pinheader
        name="J1"
        pinCount={5}
        gender="female"
        pitch="2.54mm"
        schWidth={0.675}
        schFacingDirection="right"
        pcbX={-18}
        pcbY={0}
        showSilkscreenPinLabels
        pinLabels={["VDD", "SWDIO", "SWCLK", "PRST", "GND"]}
        connections={{
          pin1: "net.VDD",
          pin2: "net.SWDIO",
          pin3: "net.SWCLK",
          pin4: "net.PRST",
          pin5: "net.GND",
        }}
      />

      <pinheader
        name="J2"
        pinCount={2}
        gender="male"
        pitch="2.54mm"
        schFacingDirection="left"
        pcbX={18}
        pcbY={-12}
        showSilkscreenPinLabels
        pinLabels={["VDD", "GND"]}
        connections={{ pin1: "net.VDD", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
