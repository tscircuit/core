import type { ChipProps } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const icm20948PinLabels = {
  pin1: ["NC9"],
  pin2: ["NC1"],
  pin3: ["NC2"],
  pin4: ["NC3"],
  pin5: ["NC4"],
  pin6: ["NC10"],
  pin7: ["AUX_CL"],
  pin8: ["VDDIO"],
  pin9: ["AD0"],
  pin10: ["REGOUT"],
  pin11: ["FSYNC"],
  pin12: ["INT1"],
  pin13: ["VDD"],
  pin14: ["NC5"],
  pin15: ["NC6"],
  pin16: ["NC7"],
  pin17: ["NC8"],
  pin18: ["GND"],
  pin19: ["RESV2"],
  pin20: ["RESV1"],
  pin21: ["AUX_DA"],
  pin22: ["NCS"],
  pin23: ["SCL"],
  pin24: ["SDA"],
  pin25: ["EP", "thermalpad"],
} as const

const ICM20948 = (props: ChipProps<typeof icm20948PinLabels>) => (
  <chip
    pinLabels={icm20948PinLabels}
    manufacturerPartNumber="ICM-20948"
    {...props}
  />
)

const C = (props: React.ComponentProps<"capacitor">) => (
  <capacitor schOrientation="vertical" {...props} />
)

test("ICM-20948 pins 9 and 11 share a downward GND label without overlap", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled={false}>
      <schematicsection
        name="Motion"
        displayName="Motion sensor and I2C pull-ups"
      />

      <ICM20948
        name="U4"
        schHeight={2.6}
        schX={-2.4}
        schY={-7.4}
        schSectionName="Motion"
      />
      <C
        name="C8"
        capacitance="100nF"
        schX={-6.4}
        schY={-9.6}
        schSectionName="Motion"
      />
      <C
        name="C9"
        capacitance="10nF"
        schX={0}
        schY={-9.6}
        schSectionName="Motion"
      />
      <C
        name="C10"
        capacitance="100nF"
        schX={2.4}
        schY={-9.6}
        schSectionName="Motion"
      />
      <resistor
        name="R7"
        resistance="4.7k"
        schX={-8.8}
        schY={-6.3}
        schSectionName="Motion"
      />
      <resistor
        name="R8"
        resistance="4.7k"
        schX={-8.8}
        schY={-7.95}
        schSectionName="Motion"
      />

      <trace from="U4.VDD" to="net.V3V3" />
      <trace from="U4.VDDIO" to="net.V3V3" />
      <trace from="U4.NCS" to="net.V3V3" />
      <trace from="U4.GND" to="net.GND" />
      <trace from="U4.EP" to="net.GND" />
      <trace from="U4.FSYNC" to="net.GND" />
      <trace from="U4.AD0" to="net.GND" />
      <trace from="U4.INT1" to="net.U4_INT1_to_U1_IO23" />
      <trace from="U4.REGOUT" to="C8.pin1" />
      <trace from="C8.pin2" to="net.GND" />
      <trace from="U4.VDDIO" to="C9.pin1" />
      <trace from="C9.pin2" to="net.GND" />
      <trace from="U4.VDD" to="C10.pin1" />
      <trace from="C10.pin2" to="net.GND" />
      <trace from="U4.SDA" to="net.U4_SDA_to_U1_IO21" />
      <trace from="U4.SCL" to="net.U4_SCL_to_U1_IO22" />
      <trace from="U4.SDA" to="R7.pin1" />
      <trace from="R7.pin2" to="net.V3V3" />
      <trace from="U4.SCL" to="R8.pin1" />
      <trace from="R8.pin2" to="net.V3V3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
