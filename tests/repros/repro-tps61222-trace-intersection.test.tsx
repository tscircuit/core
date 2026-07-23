import { expect, test } from "bun:test"
import type { ChipProps, SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const TPS61222 = (props: ChipProps) => (
  <chip
    manufacturerPartNumber="TPS61222DCKT"
    schWidth="2.5mm"
    schHeight="1,5mm"
    pinLabels={{
      pin1: "VIN",
      pin2: "FB",
      pin3: "GND",
      pin4: "VOUT",
      pin5: "L",
      pin6: "EN",
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: [4, 2],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: [5, 1, 6, 3],
      },
    }}
    {...props}
  />
)

const TPS61222TraceIntersectionRepro = (props: SubcircuitProps) => (
  <subcircuit {...props} routingDisabled schMaxTraceDistance={20}>
    <TPS61222
      name="U2"
      schX={0}
      schY={0}
      connections={{
        pin1: "net.VIN_3V3",
        pin2: "net.VIN_5V",
        pin3: "net.GND",
        pin4: "net.VIN_5V",
        pin5: "net.BOOST_SW",
        pin6: "net.VIN_3V3",
      }}
    />

    <schematictext schX={0} schY={0} text="TPS61222" fontSize={0.2} />

    <inductor
      name="L4"
      inductance="4.7uH"
      schX={4.1}
      schY={1.3}
      schOrientation="horizontal"
      connections={{
        pin1: "net.BOOST_SW",
        pin2: "net.VIN_3V3",
      }}
    />

    <capacitor
      name="C25"
      capacitance="10uF"
      footprint="0603"
      schX={-4.4}
      schY={0}
      schOrientation="vertical"
      connections={{
        pin1: "net.VIN_5V",
        pin2: "net.GND",
      }}
    />

    <capacitor
      name="C26"
      capacitance="10uF"
      footprint="0603"
      schX={6}
      schY={0}
      schOrientation="vertical"
      connections={{
        pin1: "net.VIN_3V3",
        pin2: "net.GND",
      }}
    />
  </subcircuit>
)

test("TPS61222 schematic trace intersection repro", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(<TPS61222TraceIntersectionRepro />)
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
