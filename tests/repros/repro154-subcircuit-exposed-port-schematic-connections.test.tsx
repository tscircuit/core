import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const LowVoltagePowerSupply = (props: SubcircuitProps) => (
  <subcircuit {...props} exposeNets>
    <port name="VOUT_3V3" direction="right" connectsTo={["net.VOUT_3V3"]} />
    <port name="SEC_GND" direction="right" connectsTo={["net.SEC_GND"]} />

    <resistor
      name="R_OUT"
      resistance="1k"
      footprint="0402"
      connections={{ pin1: "net.VOUT_3V3", pin2: "net.LVPS_INTERNAL" }}
    />
    <capacitor
      name="C_OUT"
      capacitance="1uF"
      footprint="0402"
      connections={{ pin1: "net.LVPS_INTERNAL", pin2: "net.SEC_GND" }}
    />
  </subcircuit>
)

const Microcontroller = (props: SubcircuitProps) => (
  <subcircuit {...props} exposeNets>
    <port name="3V3" direction="left" connectsTo={["net.V3V3"]} />
    <port name="GND" direction="left" connectsTo={["net.GND"]} />

    <resistor
      name="R_LOAD"
      resistance="10k"
      footprint="0402"
      connections={{ pin1: "net.V3V3", pin2: "net.MCU_INTERNAL" }}
    />
    <capacitor
      name="C_DECOUP"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin1: "net.MCU_INTERNAL", pin2: "net.GND" }}
    />
  </subcircuit>
)

test("subcircuit exposed ports render both power and ground schematic links", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <group name="control">
        <LowVoltagePowerSupply name="lvps" showAsSchematicBox schX={-2} />
        <Microcontroller name="mcu" showAsSchematicBox schX={2} />

        <trace name="t_v3v3_link" path={[".lvps > .VOUT_3V3", ".mcu > .3V3"]} />
        <trace name="t_gnd_link" path={[".lvps > .SEC_GND", ".mcu > .GND"]} />

        <port name="SYS_VCC" direction="left" connectsTo={["lvps.VOUT_3V3"]} />
        <port name="SYS_GND" direction="left" connectsTo={["lvps.SEC_GND"]} />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
