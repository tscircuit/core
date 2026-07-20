import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

interface CircuitBlockProps {
  name: string
  showAsSchematicBox?: boolean
}

const SensorFrontEnd = ({ name, showAsSchematicBox }: CircuitBlockProps) => (
  <subcircuit name={name} showAsSchematicBox={showAsSchematicBox}>
    <port name="VCC" direction="left" connectsTo={["R_p.pin1"]} />
    <port name="GND" direction="left" connectsTo={["C_f.pin2"]} />
    <port name="SIG_OUT" direction="right" connectsTo={["R_p.pin2"]} />
    <resistor name="R_p" resistance="10k" footprint="0603" />
    <capacitor name="C_f" capacitance="100nF" footprint="0603" />
    <trace name="tr_internal_sig" from=".R_p.pin2" to=".C_f.pin1" />
  </subcircuit>
)

const SignalProcessor = ({ name, showAsSchematicBox }: CircuitBlockProps) => (
  <subcircuit name={name} showAsSchematicBox={showAsSchematicBox}>
    <port name="VCC" direction="left" connectsTo={["R_l.pin1"]} />
    <port name="SIG_IN" direction="left" connectsTo={["R_l.pin2"]} />
    <port name="GND" direction="right" connectsTo={["C_d.pin2"]} />

    <resistor name="R_l" resistance="1k" footprint="0402" />
    <capacitor name="C_d" capacitance="1uF" footprint="0402" />

    <trace name="tr_internal_vcc" from=".R_l.pin1" to=".C_d.pin1" />
  </subcircuit>
)

const ControlCircuitSystem = ({
  name,
  showAsSchematicBox,
}: CircuitBlockProps) => (
  <group name={name} showAsSchematicBox={showAsSchematicBox}>
    <SensorFrontEnd name="sensor" showAsSchematicBox />
    <SignalProcessor name="processor" showAsSchematicBox />

    <trace name="t_signal_bus" path={["sensor.SIG_OUT", "processor.SIG_IN"]} />
    <trace name="t_vcc_bus" path={["sensor.VCC", "processor.VCC"]} />
    <trace name="t_gnd_bus" path={["sensor.GND", "processor.GND"]} />

    <port name="SYS_VCC" direction="left" connectsTo={["sensor.VCC"]} />
    <port name="SYS_GND" direction="left" connectsTo={["sensor.GND"]} />
  </group>
)

test("boxed subcircuit ports render signal, power, and ground schematic links", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <ControlCircuitSystem name="control" showAsSchematicBox={false} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
