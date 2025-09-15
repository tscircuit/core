import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("should create simulation_voltage_source from a complex circuit with multiple chips", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1_Test" resistance="10k" footprint="0402" />
      <chip name="U1_Test" footprint="soic8" />
      <trace from=".R1_Test > .pin1" to="net.SCL" />
      <trace from="net.VCC" to=".U1_Test > .pin1" />
      <chip
        name="U_REG"
        footprint="soic8"
        pinLabels={{
          pin2: "GND",
          pin3: "VOUT",
        }}
        pinAttributes={{
          VOUT: { providesPower: true, providesVoltage: 3.3 },
          GND: { providesGround: true },
        }}
      />
      <chip
        name="U_MCU"
        footprint="soic8"
        pinLabels={{
          pin8: "VCC",
          pin4: "GND",
        }}
      />
      <trace from=".U_REG > .VOUT" to="net.V_3V3" />
      <trace from=".U_REG > .GND" to="net.GND" />
      <trace from=".U_MCU > .VCC" to="net.V_3V3" />
      <trace from=".U_MCU > .GND" to="net.GND" />
      <resistor name="R2_Test" resistance="10k" footprint="0402" />
      <chip name="U2_Test" footprint="soic8" />
      <trace from=".R2_Test > .pin1" to=".U2_Test > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const simulationVoltageSources = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "simulation_voltage_source")

  expect(simulationVoltageSources).toHaveLength(1)

  const source = simulationVoltageSources[0] as any

  const voutPort = circuit.db.source_port.getWhere({ name: "VOUT" })
  const gndPort = circuit.db.source_port.getWhere({
    name: "GND",
    source_component_id: circuit.db.source_component.getWhere({
      name: "U_REG",
    })?.source_component_id,
  })
  const vccNet = circuit.db.source_net.getWhere({ name: "V_3V3" })
  const gndNet = circuit.db.source_net.getWhere({ name: "GND" })

  expect(source.voltage).toBe(3.3)
  expect(source.positive_source_port_id).toBe(voutPort?.source_port_id)
  expect(source.negative_source_port_id).toBe(gndPort?.source_port_id)
  expect(source.positive_source_net_id).toBe(vccNet?.source_net_id)
  expect(source.negative_source_net_id).toBe(gndNet?.source_net_id)
})
