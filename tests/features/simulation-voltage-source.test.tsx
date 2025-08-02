import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("should create simulation_voltage_source from chip with power providing pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin8: "VCC",
          pin4: "GND",
        }}
        pinAttributes={{
          VCC: { providesPower: true, providesVoltage: 5 },
          GND: { providesGround: true },
        }}
      />
      <trace from=".U1 > .VCC" to="net.VCC" />
      <trace from=".U1 > .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const simulationVoltageSources = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "simulation_voltage_source")

  expect(simulationVoltageSources).toHaveLength(1)

  const source = simulationVoltageSources[0] as any

  const vccPort = circuit.db.source_port.getWhere({ name: "VCC" })
  const gndPort = circuit.db.source_port.getWhere({ name: "GND" })
  const vccNet = circuit.db.source_net.getWhere({ name: "VCC" })
  const gndNet = circuit.db.source_net.getWhere({ name: "GND" })

  expect(source.voltage).toBe(5)
  expect(source.positive_source_port_id).toBe(vccPort?.source_port_id)
  expect(source.negative_source_port_id).toBe(gndPort?.source_port_id)
  expect(source.positive_source_net_id).toBe(vccNet?.source_net_id)
  expect(source.negative_source_net_id).toBe(gndNet?.source_net_id)
})
