import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const picoPinLabels = {
  pin1: "GP0",
  pin2: "GP1",
  pin3: "GND_1",
  pin4: "GP2",
  pin5: "GP3",
  pin6: "GP4",
  pin7: "GP5",
  pin8: "GND_2",
  pin9: "GP6",
  pin10: "GP7",
  pin11: "GP8",
  pin12: "GP9",
  pin13: "GND_3",
  pin14: "GP10",
  pin15: "GP11",
  pin16: "GP12",
  pin17: "GP13",
  pin18: "GND_4",
  pin19: "GP14",
  pin20: "GP15",
  pin21: "GP16",
  pin22: "GP17",
  pin23: "GND_5",
  pin24: "GP18",
  pin25: "GP19",
  pin26: "GP20",
  pin27: "GP21",
  pin28: "GND_6",
  pin29: "GP22",
  pin30: "RUN",
  pin31: "GP26_A0",
  pin32: "GP27_A1",
  pin33: "GND_7",
  pin34: "GP28_A2",
  pin35: "ADC_VREF",
  pin36: "3V3(OUT)",
  pin37: "3V3_EN",
  pin38: "GND_8",
  pin39: "VSYS",
  pin40: "VBUS",
  pin41: "GND_10",
  pin42: "USB_DM",
  pin43: "USB_DP",
  pin44: "GPIO23/SMPS_PS_PIN_(DO_NOT_USE)",
  pin45: "GPIO25/LED_(NOT_RECOMMENDED_TO_BE_USED)",
  pin46: "BOOTSEL",
  pin47: "SWCLK",
  pin48: "GND_9",
  pin49: "SWDIO",
} as const

const usbPinLabels = {
  pin1: "GND",
  pin2: "VBUS",
  pin3: "SBU2",
  pin4: "CC1",
  pin5: "DN2",
  pin6: "DP1",
  pin7: "DN1",
  pin8: "DP2",
  pin9: "SBU1",
  pin10: "CC2",
  pin11: "VBUS",
  pin12: "GND",
  pin13: "SHIELD",
} as const

const leftPicoPins = Array.from({ length: 20 }, (_, index) => index + 1)
const rightPicoPins = Array.from({ length: 20 }, (_, index) => index + 21)

const signalNets = [
  [1, "SDA"],
  [2, "SCL"],
  [4, "UP"],
  [5, "DOWN"],
  [6, "RIGHT"],
  [7, "LEFT"],
  [9, "B1"],
  [10, "B2"],
  [11, "R2"],
  [12, "L2"],
  [14, "B3"],
  [15, "B4"],
  [16, "R1"],
  [17, "L1"],
  [19, "TURBO"],
  [20, "LED_TURBO"],
  [21, "S1"],
  [22, "S2"],
  [24, "L3"],
  [25, "R3"],
  [26, "A1"],
  [27, "A2"],
  [31, "R5"],
  [32, "L5"],
  [34, "LED_RGB"],
] as const

const NetTrace = ({ from, to }: { from: string; to: string }) => (
  <trace from={from} to={to} />
)

test("reproduces RP2040 gamepad trace routing", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board schMaxTraceDistance={8}>
      <chip
        name="USB1"
        manufacturerPartNumber="HRO-TYPE-C-31-M-12"
        schX={-8}
        schY={3}
        schWidth={1.8}
        schHeight={3.6}
        pinLabels={usbPinLabels}
        schPinArrangement={{
          rightSide: {
            pins: Array.from({ length: 13 }, (_, index) => index + 1),
            direction: "top-to-bottom",
          },
        }}
      />

      <resistor
        name="R1"
        resistance="5.1k"
        schX={-5.5}
        schY={0.7}
        schRotation={90}
      />
      <resistor
        name="R2"
        resistance="5.1k"
        schX={-4}
        schY={0.7}
        schRotation={90}
      />

      <chip
        name="J2"
        manufacturerPartNumber="PICO"
        schX={4}
        schY={0}
        schWidth={3.5}
        schHeight={11}
        pinLabels={picoPinLabels}
        schPinArrangement={{
          leftSide: {
            pins: leftPicoPins,
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: rightPicoPins,
            direction: "bottom-to-top",
          },
          topSide: {
            pins: [41, 42, 43, 44, 45, 46],
            direction: "left-to-right",
          },
          bottomSide: {
            pins: [47, 48, 49],
            direction: "left-to-right",
          },
        }}
      />

      <trace from="USB1.pin4" to="R1.pin1" />
      <trace from="USB1.pin10" to="R2.pin1" />

      {[1, 12, 13].map((pin) => (
        <NetTrace
          key={`usb-gnd-${pin}`}
          from={`USB1.pin${pin}`}
          to="net.GNDPWR"
        />
      ))}
      <trace from="R1.pin2" to="net.GNDPWR" />
      <trace from="R2.pin2" to="net.GNDPWR" />
      <trace from="J2.pin41" to="net.GNDPWR" />

      <trace from="USB1.pin2" to="net.V5" />
      <trace from="USB1.pin11" to="net.V5" />
      <trace from="J2.pin40" to="net.V5" />

      <trace from="USB1.pin5" to="net.D_MINUS" />
      <trace from="USB1.pin7" to="net.D_MINUS" />
      <trace from="USB1.pin6" to="net.D_PLUS" />
      <trace from="USB1.pin8" to="net.D_PLUS" />

      {signalNets.map(([pin, net]) => (
        <NetTrace
          key={`j2-${pin}-${net}`}
          from={`J2.pin${pin}`}
          to={`net.${net}`}
        />
      ))}

      {[3, 8, 13, 18, 23, 28, 33, 38, 48].map((pin) => (
        <NetTrace key={`j2-gnd-${pin}`} from={`J2.pin${pin}`} to="net.GND" />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
