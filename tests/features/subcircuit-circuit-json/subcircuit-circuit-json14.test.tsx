import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const SubcircuitExample1 = (props: any) => {
  return (
    <subcircuit name={props.name} exposedNets={props.exposedNets}>
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "SDA",
          pin2: "SCL",
          pin3: "VCC",
          pin4: "GND",
        }}
        connections={{
          SDA: "net.SDA",
          SCL: "net.SCL",
          VCC: "net.VCC",
          GND: "net.GND",
        }}
      />
    </subcircuit>
  )
}

const SubcircuitExample2 = (props: any) => {
  return (
    <subcircuit name={props.name} exposedNets={props.exposedNets}>
      <chip
        name="U2"
        footprint="soic8"
        pinLabels={{
          pin1: "SDA",
          pin2: "SCL",
          pin3: "VCC",
          pin4: "GND",
        }}
        connections={{
          SDA: "net.SDA",
          SCL: "net.SCL",
          VCC: "net.VCC",
          GND: "net.GND",
        }}
      />
    </subcircuit>
  )
}

test.failing("subcircuit-circuit-json14 - subcircuit name prop being passed to the chip should connect chip of the other subcircuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <SubcircuitExample1 name="Sub1" exposedNets={["SDA", "SCL"]} />
      <SubcircuitExample2 name="Sub2" exposedNets={["SDA", "SCL"]} />

      <net name="I2C_SDA" />
      <net name="I2C_SCL" />

      <trace from=".Sub1 > net.SDA" to="net.I2C_SDA" />
      <trace from=".Sub2 > net.SDA" to="net.I2C_SDA" />

      <trace from=".Sub1 > net.SCL" to="net.I2C_SCL" />
      <trace from=".Sub2 > net.SCL" to="net.I2C_SCL" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()
  expect(pcbTrace).toHaveLength(2)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
