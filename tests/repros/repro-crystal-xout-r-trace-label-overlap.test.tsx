import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: crystal branch trace overlaps the XOUT_R net label", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schMaxTraceDistance="0.8mm">
      <net name="GND" isGroundNet />
      <schematicsection name="controller" />
      <schematicsection name="clock" />

      <schematictext
        text="REPRO: trace must not overlap XOUT_R"
        schX={0.8}
        schY={1.5}
        fontSize={0.2}
      />

      <chip
        name="U1"
        pinLabels={{ pin1: ["XIN"] }}
        schSectionName="controller"
      />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="10pF"
        pinVariant="four_pin"
        schX={0}
        schY={0}
        schSectionName="clock"
      />
      <capacitor
        name="C_XIN"
        capacitance="15pF"
        schX={-0.15}
        schY={-1.75}
        schOrientation="vertical"
        schSectionName="clock"
      />
      <capacitor
        name="C_XOUT"
        capacitance="15pF"
        schX={1.7}
        schY={-1.75}
        schOrientation="vertical"
        schSectionName="clock"
      />
      <resistor
        name="R_XOUT"
        resistance="1k"
        schX={2.9}
        schY={0}
        schSectionName="clock"
      />

      <trace
        name="Y1_G1"
        from=".Y1 > .pin2"
        to="net.GND"
        displayName="GND"
        schDisplayLabel="GND"
      />
      <trace
        name="Y1_G2"
        from=".Y1 > .pin4"
        to="net.GND"
        displayName="GND"
        schDisplayLabel="GND"
      />
      <trace name="XIN" from=".Y1 > .pin1" to=".U1 > .XIN" />
      <trace name="CXIN" from=".C_XIN > .pin1" to=".Y1 > .pin1" />
      <trace name="XOUT_R" from=".Y1 > .pin3" to=".R_XOUT > .pin1" />
      <trace name="CXOUT" from=".C_XOUT > .pin1" to=".Y1 > .pin3" />
      <trace from=".C_XIN > .pin2" to="net.GND" />
      <trace from=".C_XOUT > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
