import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const MOTOR_PIN_LABELS = {
  pin1: "pin1",
  pin2: "pin2",
}

const MOTOR = (props: any) => <chip {...props} pinLabels={MOTOR_PIN_LABELS} />

const DRV8833_PIN_LABELS = {
  pin16: "AIN1",
  pin15: "AIN2",
  pin9: "BIN1",
  pin10: "BIN2",
  pin1: "NSLEEEP",
  pin13: "GND",
  pin11: "VCP",
  pin2: "AOUT1",
  pin4: "AOUT2",
  pin7: "BOUT1",
  pin5: "BOUT2",
  pin8: "NFAULT",
  pin14: "VINT",
  pin3: "AISEN",
  pin6: "BISEN",
  pin12: "VM",
}

const DRV8833 = (props: any) => (
  <chip
    {...props}
    pinLabels={DRV8833_PIN_LABELS}
    schPinArrangement={{
      leftSide: ["AIN1", "AIN2", "BIN1", "BIN2", "NSLEEEP"],
      rightSide: [
        "VCP",
        "AOUT1",
        "AOUT2",
        "BOUT1",
        "BOUT2",
        "NFAULT",
        "VINT",
        "AISEN",
        "BISEN",
      ],
      bottomSide: ["GND"],
      topSide: ["VM"],
    }}
    schPinStyle={{
      AIN2: {
        marginBottom: 0.4,
      },
      BIN2: {
        marginBottom: 0.4,
      },
      VINT: {
        marginTop: 0.4,
      },
      BOUT1: {
        marginTop: 0.4,
      },
      AOUT1: {
        marginTop: 0.4,
      },
    }}
  />
)

const board = () => (
  <board>
    <DRV8833 schX={0} schY={0} name="U1" />
    <trace from=".U1 > .GND" to="net.GND" />
    <trace from=".U1 > .BIN1" to="net.IN1" />
    <trace from=".U1 > .AIN1" to="net.IN1" />
    <trace from=".U1 > .BIN2" to="net.IN2" />
    <trace from=".U1 > .AIN2" to="net.IN2" />
    <trace from=".U1 > .VM" to="net.VM" />
    <resistor
      schX={3}
      schY={-1.8}
      name="R1"
      resistance="200"
      schRotation={-90}
    />
    <trace from=".U1 > .BISEN" to=".R1 > .pin1" />
    <trace from="net.GND" to=".R1 > .pin2" />
    <trace from=".U1 > .AISEN" to=".R1 > .pin1" />
    <capacitor
      schX={4}
      schY={-1.8}
      name="C2"
      capacitance="2.2uF"
      schRotation={-90}
    />
    <trace from=".U1 > .VINT" to=".C2 > .pin1" />
    <trace from="net.GND" to=".C2 > .pin2" />
    <capacitor
      schX={0.75}
      schY={2.75}
      name="C4"
      capacitance="10uF"
      schRotation={-90}
    />
    <trace from="net.GND" to=".C4 > .pin2" />
    <trace from="net.VM" to=".C4 > .pin1" />
    <capacitor
      schX={1.5}
      schY={2.75}
      name="C1"
      capacitance="0.01uF"
      schRotation={-90}
    />
    <trace from="net.VM" to=".C1 > .pin1" />
    <trace from=".U1 > .VCP" to=".C1 > .pin2" />

    <MOTOR name="Motor" schX={3} schY={0.8} schWidth={0.75} />
    <trace from=".U1 > .AOUT1" to=".Motor > .pin1" />
    <trace from=".U1 > .BOUT1" to=".Motor > .pin1" />

    <trace from=".Motor > .pin2" to=".U1 > .BOUT2" />
    <trace from=".Motor > .pin2" to=".U1 > .AOUT2" schDisplayLabel="BOUT" />
  </board>
)

test("repro128: traces being unecessarily broken into net labels / merged traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(board())

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
