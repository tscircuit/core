import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const t113AnalogPinLabels = {
  pin89: ["AVCC"],
  pin90: ["VRA2"],
  pin91: ["AGND"],
  pin92: ["VRA1"],
  pin93: ["FMINR"],
  pin94: ["FMINL"],
} as const

test("repro175: GND symbol overlaps adjacent T113 analog net labels", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance="0.8mm">
      <schematictext
        text="REPRO: GND must not overlap VRA1, VRA2, or P1V8 labels"
        schX={2}
        schY={4}
        fontSize={0.3}
      />

      <chip
        name="U3"
        manufacturerPartNumber="T113-S3"
        pinLabels={t113AnalogPinLabels}
        schX={0}
        schY={0}
        schWidth="3mm"
        schHeight="4mm"
        schPinArrangement={{
          rightSide: {
            pins: ["FMINL", "FMINR", "VRA1", "AGND", "VRA2", "AVCC"],
            direction: "top-to-bottom",
          },
        }}
      />

      <capacitor
        name="C38"
        capacitance="100nF"
        schX={7.25}
        schY={-1}
        schOrientation="vertical"
        connections={{
          pin1: "net.Net_U3F_VRA2",
          pin2: "net.GND",
        }}
      />
      <capacitor
        name="C39"
        capacitance="100nF"
        schX={9}
        schY={-1}
        schOrientation="vertical"
        connections={{
          pin1: "net.Net_U3F_VRA1",
          pin2: "net.GND",
        }}
      />
      <capacitor
        name="C19"
        capacitance="100nF"
        schX={8}
        schY={5}
        schOrientation="vertical"
        connections={{
          pin1: "net.P1V8",
          pin2: "net.GND",
        }}
      />

      <trace from="U3.FMINL" to="net.GND" />
      <trace from="U3.FMINR" to="net.GND" />
      <trace from="U3.VRA1" to="net.Net_U3F_VRA1" />
      <trace from="U3.AGND" to="net.GND" />
      <trace from="U3.VRA2" to="net.Net_U3F_VRA2" />
      <trace from="U3.AVCC" to="net.P1V8" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
