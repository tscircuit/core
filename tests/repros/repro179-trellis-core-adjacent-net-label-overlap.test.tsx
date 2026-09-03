import type { ChipProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const t113AnalogPinLabels = {
  pin86: ["PB2"],
  pin87: ["MICIN3P"],
  pin88: ["MICIN3N"],
  pin89: ["AVCC"],
  pin90: ["VRA2"],
  pin91: ["AGND"],
  pin92: ["VRA1"],
  pin93: ["FMINR"],
  pin94: ["FMINL"],
  pin95: ["LINEINR"],
  pin96: ["LINEINL"],
  pin97: ["HPVCC"],
} as const

const T113AnalogPins = (props: ChipProps<typeof t113AnalogPinLabels>) => (
  <chip
    manufacturerPartNumber="T113-S3"
    pinLabels={t113AnalogPinLabels}
    schWidth="3mm"
    schHeight="3mm"
    schPinArrangement={{
      rightSide: {
        direction: "top-to-bottom",
        pins: [97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86],
      },
    }}
    {...props}
  />
)

test("repro179: adjacent T113 VRA and GND net labels overlap", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board
      routingDisabled
      schAutoLayoutEnabled
      schTraceAutoLabelEnabled
      schMaxTraceDistance="0.8mm"
    >
      <net name="P1V8" isPowerNet />
      <net name="GND" isGroundNet />

      <schematictext
        text="REPRO: keep adjacent AUDIO_VRA1, GND, and AUDIO_VRA2 labels readable"
        schX={2.5}
        schY={2.25}
        fontSize={0.22}
      />

      <T113AnalogPins
        name="U3"
        schX={0}
        schY={0}
        connections={{
          pin89: "net.P1V8",
          pin90: "net.AUDIO_VRA2",
          pin91: "net.GND",
          pin92: "net.AUDIO_VRA1",
          pin93: "net.GND",
          pin94: "net.GND",
          pin97: "net.P1V8",
        }}
        noConnect={["pin86", "pin87", "pin88", "pin95", "pin96"]}
      />

      <capacitor
        name="C38"
        capacitance="100nF"
        schX={5}
        schY={-0.5}
        schOrientation="vertical"
        decouplingFor=".U3 > .VRA2"
        decouplingTo="net.GND"
      />
      <capacitor
        name="C39"
        capacitance="100nF"
        schX={6.75}
        schY={-0.5}
        schOrientation="vertical"
        decouplingFor=".U3 > .VRA1"
        decouplingTo="net.GND"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
